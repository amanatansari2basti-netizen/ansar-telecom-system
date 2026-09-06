import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import StaffNotificationBanner from "../components/StaffNotificationBanner";

const AlertNotificationContext = createContext({
  activeAlert: null,
  triggerAlert: () => {},
  dismissAlert: () => {},
  testAlert: () => {},
});

export const AlertNotificationProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [activeAlert, setActiveAlert] = useState(null);

  // Track acknowledged IDs to avoid repeat alarms on the same event
  const acknowledgedEventsRef = useRef(new Set());
  const initialLoadTimeRef = useRef(Date.now());

  // Listen to Auth State
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(String(data.role || "").toLowerCase());
            setUserName(data.name || data.fullName || data.technicianName || user.displayName || "");
          } else {
            // Default fallback if not found in users collection
            setUserRole(null);
            setUserName(user.displayName || user.email || "");
          }
        } catch (err) {
          console.debug("User role fetch error:", err);
        }
      } else {
        setUserRole(null);
        setUserName("");
      }
    });

    return () => unsubAuth();
  }, []);

  const triggerAlert = useCallback((alertData) => {
    if (!alertData) return;
    const eventKey = `${alertData.type}_${alertData.jobId || alertData.id || Date.now()}`;

    // Prevent re-triggering the same event within 3 minutes
    if (acknowledgedEventsRef.current.has(eventKey)) {
      return;
    }
    acknowledgedEventsRef.current.add(eventKey);

    setActiveAlert({
      ...alertData,
      triggeredAt: Date.now(),
    });
  }, []);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const testAlert = useCallback(
    (type = "job_assigned") => {
      triggerAlert({
        type,
        jobId: type === "job_assigned" ? "TEST-JOB-999" : "TEST-PICKUP-888",
        customerName: "Amanat Test",
        phone: "+91 98765 43210",
        device: "Samsung Galaxy S23 Ultra",
        problem: "Display replacement / Screen broken",
        address: "Gandhi Nagar, Basti, UP",
      });
    },
    [triggerAlert]
  );

  /* =========================================================
     LISTENER 1: CUSTOMER PICK & DROP BOOKINGS
     Who receives this: RIDER, OWNER (Admin), and RECEPTIONIST
  ========================================================= */
  useEffect(() => {
    // Only listen if user is logged in
    if (!currentUser) return undefined;

    // Check if user role is owner, receptionist, or rider (or if role not yet resolved)
    const isTargetRole =
      !userRole ||
      userRole === "owner" ||
      userRole === "admin" ||
      userRole === "receptionist" ||
      userRole === "rider";

    if (!isTargetRole) return undefined;

    let initialLoad = true;
    const pickupCol = collection(db, "pickupRequests");

    const unsubPickup = onSnapshot(
      pickupCol,
      (snapshot) => {
        if (initialLoad) {
          // Pre-populate acknowledged set with current items so we don't alarm on old entries
          snapshot.forEach((d) => {
            acknowledgedEventsRef.current.add(`pickup_booked_${d.id}`);
          });
          initialLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const createdAtMs =
              data.createdAt?.toMillis?.() ||
              (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : null) ||
              Date.now();

            // Verify it was created recently (within last 3 minutes or since page load)
            const isRecent = createdAtMs >= initialLoadTimeRef.current - 120000;

            if (isRecent) {
              const fullDevice =
                data.device ||
                [data.brand || data.deviceBrand, data.model || data.deviceModel].filter(Boolean).join(" ") ||
                "Customer Device";

              const fullAddress =
                typeof data.address === "string"
                  ? data.address
                  : data.pickupAddress?.address || "Customer Address";

              triggerAlert({
                type: "pickup_booked",
                jobId: change.doc.id,
                customerName: data.customerName || data.customer?.name || "Customer",
                phone: data.phone || data.customer?.phone || data.mobile || "",
                device: fullDevice,
                problem: data.problem || data.issue || "Pick & Drop Repair",
                address: fullAddress,
              });
            }
          }
        });
      },
      (err) => {
        console.debug("Pickup requests notification listener error:", err);
      }
    );

    return () => unsubPickup();
  }, [currentUser, userRole, triggerAlert]);

  /* =========================================================
     LISTENER 2: TECHNICIAN JOB ASSIGNMENT
     Who receives this: TECHNICIANS when a job is assigned to them
  ========================================================= */
  useEffect(() => {
    if (!currentUser) return undefined;

    // Check if role is technician (or if current page might be technician)
    const isTech = userRole === "technician" || !userRole;
    if (!isTech) return undefined;

    const myUid = String(currentUser.uid);
    const myNameNormalized = userName ? userName.trim().toLowerCase() : "";

    const isAssignedToThisTech = (jobData) => {
      const ids = [
        jobData.assignedTechnicianId,
        jobData.assignedToId,
        jobData.technicianId,
        jobData.technicianUid,
        jobData.userId,
      ]
        .filter(Boolean)
        .map(String);

      if (ids.includes(myUid)) return true;

      if (myNameNormalized) {
        const names = [
          jobData.assignedTechnician,
          jobData.assignedTo,
          jobData.technician,
          jobData.technicianName,
        ]
          .filter(Boolean)
          .map((n) => String(n).trim().toLowerCase());

        if (names.includes(myNameNormalized)) return true;
      }

      return false;
    };

    let initialLoad = true;
    const jobsCol = collection(db, "repairJobs");

    const unsubJobs = onSnapshot(
      jobsCol,
      (snapshot) => {
        if (initialLoad) {
          snapshot.forEach((d) => {
            const data = d.data();
            const assignmentTime =
              data.lastAssignedAt?.toMillis?.() ||
              data.assignedAt?.toMillis?.() ||
              data.assignmentAlertTrigger ||
              0;
            acknowledgedEventsRef.current.add(`job_assigned_${d.id}_${assignmentTime}`);
          });
          initialLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const data = change.doc.data();

            // Skip closed jobs
            if (
              data.status === "Completed" ||
              data.status === "Delivered" ||
              data.status === "Cancelled"
            ) {
              return;
            }

            if (isAssignedToThisTech(data)) {
              const assignmentTime =
                data.lastAssignedAt?.toMillis?.() ||
                data.assignedAt?.toMillis?.() ||
                data.assignmentAlertTrigger ||
                0;

              const eventKey = `job_assigned_${change.doc.id}_${assignmentTime}`;

              // If newly assigned or updated recently and not yet acknowledged
              const isRecent =
                assignmentTime >= initialLoadTimeRef.current - 60000 ||
                (data.assignmentAlertTrigger && Date.now() - data.assignmentAlertTrigger < 45000);

              if (isRecent && !acknowledgedEventsRef.current.has(eventKey)) {
                acknowledgedEventsRef.current.add(eventKey);

                const fullDevice =
                  data.device ||
                  [data.brand, data.model].filter(Boolean).join(" ") ||
                  "Device";

                triggerAlert({
                  type: "job_assigned",
                  jobId: change.doc.id,
                  customerName: data.customerName || data.customer || "Customer",
                  phone: data.phone || data.mobileNumber || "",
                  device: fullDevice,
                  problem: data.reportedProblem || data.problem || data.issue || "Diagnostic & Repair",
                });
              }
            }
          }
        });
      },
      (err) => {
        console.debug("Jobs notification listener error:", err);
      }
    );

    return () => unsubJobs();
  }, [currentUser, userRole, userName, triggerAlert]);

  const handleBannerAction = (alert) => {
    dismissAlert();
    if (alert.type === "job_assigned") {
      window.location.href = "/technician";
    } else if (alert.type === "pickup_booked") {
      if (userRole === "rider") {
        window.location.href = "/rider";
      } else if (userRole === "receptionist") {
        window.location.href = "/reception";
      } else {
        window.location.href = "/repair-jobs";
      }
    }
  };

  return (
    <AlertNotificationContext.Provider
      value={{
        activeAlert,
        triggerAlert,
        dismissAlert,
        testAlert,
      }}
    >
      {children}
      {activeAlert && (
        <StaffNotificationBanner
          alert={activeAlert}
          onDismiss={dismissAlert}
          onAction={handleBannerAction}
        />
      )}
    </AlertNotificationContext.Provider>
  );
};

export const useAlertNotification = () => useContext(AlertNotificationContext);
