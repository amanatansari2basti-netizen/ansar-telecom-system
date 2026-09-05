import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../technicians.css";

import TechnicianDetailsModal from "../components/TechnicianDetailsModal";
import AddTechnicianModal from "../components/AddTechnicianModal";

import {
  Activity,
  CheckCircle2,
  ChevronRight,
  IndianRupee,
  PackageCheck,
  Search,
  UserCog,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../firebase/firebase";

/* =========================================================
   HELPERS
========================================================= */

const cleanPhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(-10);

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getWorkStatusClass = (
  activeJobs,
  staffStatus,
  availabilityStatus
) => {
  if (
    staffStatus === "Inactive"
  ) {
    return "technician-work-status inactive";
  }

  if (
    staffStatus === "On Leave" ||
    availabilityStatus === "Leave"
  ) {
    return "technician-work-status leave";
  }

  if (
    availabilityStatus === "Off Duty" ||
    availabilityStatus === "Not Available"
  ) {
    return "technician-work-status inactive";
  }

  if (
    availabilityStatus === "On Break"
  ) {
    return "technician-work-status leave";
  }

  if (activeJobs > 0) {
    return "technician-work-status active";
  }

  return "technician-work-status available";
};

const getStatusLabel = (
  technician
) => {
  if (
    technician.staffStatus ===
    "Inactive"
  ) {
    return "Inactive";
  }

  if (
    technician.staffStatus ===
      "On Leave" ||
    technician.availabilityStatus ===
      "Leave"
  ) {
    return "On Leave";
  }

  if (
    technician.availabilityStatus ===
    "On Break"
  ) {
    return "On Break";
  }

  if (
    technician.availabilityStatus ===
    "Off Duty"
  ) {
    return "Off Duty";
  }

  if (
    technician.availabilityStatus ===
    "Not Available"
  ) {
    return "Not Available";
  }

  if (
    technician.activeJobs > 0
  ) {
    return "Active";
  }

  return "Available";
};

/* =========================================================
   COMPONENT
========================================================= */

const Technicians = () => {
  const [
    jobs,
    setJobs,
  ] = useState([]);

  const [
    userTechnicians,
    setUserTechnicians,
  ] = useState([]);

  const [
    profileTechnicians,
    setProfileTechnicians,
  ] = useState([]);

  const [
    firebaseLoading,
    setFirebaseLoading,
  ] = useState(true);

  const [
    firebaseError,
    setFirebaseError,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    selectedTechnician,
    setSelectedTechnician,
  ] = useState(null);

  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);

  const [
    isAddOpen,
    setIsAddOpen,
  ] = useState(false);

  /* =========================================================
     REAL-TIME USERS/{UID}
  ========================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "users"
        ),
        (snapshot) => {
          const list = [];

          snapshot.forEach(
            (docSnap) => {
              const data =
                docSnap.data();

              const role =
                normalizeText(
                  data.role
                );

              if (
                role !==
                "technician"
              ) {
                return;
              }

              list.push({
                id: docSnap.id,
                uid: docSnap.id,
                authUid: docSnap.id,
                ...data,
              });
            }
          );

          setUserTechnicians(
            list
          );

          setFirebaseLoading(
            false
          );
        },
        (error) => {
          console.error(
            "Unable to load technician users:",
            error
          );

          setFirebaseError(
            "Technician accounts could not be synced."
          );

          setFirebaseLoading(
            false
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================================
     REAL-TIME technicians/{UID}
  ========================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "technicians"
        ),
        (snapshot) => {
          const list =
            snapshot.docs.map(
              (docSnap) => {
                const data =
                  docSnap.data();

                const uid =
                  data.authUid ||
                  data.uid ||
                  data.userId ||
                  docSnap.id;

                return {
                  id: uid,
                  uid,
                  authUid: uid,
                  documentId:
                    docSnap.id,
                  ...data,
                };
              }
            );

          setProfileTechnicians(
            list
          );
        },
        (error) => {
          console.error(
            "Unable to load technician profiles:",
            error
          );

          setFirebaseError(
            "Technician profiles could not be synced."
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================================
     REAL-TIME REPAIR JOBS
  ========================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "repairJobs"
        ),
        (snapshot) => {
          setJobs(
            snapshot.docs.map(
              (docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
              })
            )
          );
        },
        (error) => {
          console.error(
            "Unable to load repair jobs:",
            error
          );

          setFirebaseError(
            "Repair jobs could not be synced."
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================================
     MERGE USERS + TECHNICIAN PROFILE
  ========================================================= */

  const savedTechnicians =
    useMemo(() => {
      const uidSet =
        new Set();

      userTechnicians.forEach(
        (tech) => {
          uidSet.add(
            String(
              tech.uid ||
                tech.id
            )
          );
        }
      );

      profileTechnicians.forEach(
        (tech) => {
          uidSet.add(
            String(
              tech.uid ||
                tech.authUid ||
                tech.id
            )
          );
        }
      );

      return Array.from(
        uidSet
      ).map(
        (uid) => {
          const userData =
            userTechnicians.find(
              (tech) =>
                String(
                  tech.uid ||
                    tech.id
                ) === uid
            ) || {};

          const profileData =
            profileTechnicians.find(
              (tech) =>
                String(
                  tech.uid ||
                    tech.authUid ||
                    tech.id
                ) === uid
            ) || {};

          return {
            ...profileData,
            ...userData,

            id: uid,
            uid,
            authUid: uid,

            documentId:
              profileData.documentId ||
              uid,

            name:
              userData.name ||
              userData.fullName ||
              profileData.name ||
              "",

            phone:
              userData.phone ||
              profileData.phone ||
              "",

            email:
              userData.email ||
              profileData.email ||
              "",

            specialization:
              userData.specialization ||
              profileData.specialization ||
              "General Repair",

            status:
              profileData.status ||
              (
                normalizeText(
                  userData.status
                ) === "inactive"
                  ? "Inactive"
                  : "Active"
              ),

            presenceStatus:
              userData.presenceStatus ||
              profileData.presenceStatus ||
              "absent",

            attendanceDate:
              userData.attendanceDate ||
              profileData.attendanceDate ||
              "",

            availabilityStatus:
              userData.availabilityStatus ||
              profileData.availabilityStatus ||
              "Off Duty",

            loginEnabled:
              userData.loginEnabled !==
                false &&
              profileData.loginEnabled !==
                false,

            currentJobId:
              userData.currentJobId ||
              profileData.currentJobId ||
              null,

            role:
              "technician",
          };
        }
      );
    }, [
      userTechnicians,
      profileTechnicians,
    ]);

  /* =========================================================
     CREATE TECHNICIAN
  ========================================================= */

  const handleCreateTechnician =
    async (
      technician
    ) => {
      const name =
        String(
          technician.name || ""
        ).trim();

      const phone =
        cleanPhone(
          technician.phone
        );

      const email =
        String(
          technician.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          technician.password || ""
        ).trim();

      const specialization =
        String(
          technician.specialization ||
            "General Repair"
        ).trim();

      const status =
        technician.status ||
        "Active";

      if (!name) {
        throw new Error(
          "Technician name is required."
        );
      }

      if (
        phone.length !== 10
      ) {
        throw new Error(
          "Enter a valid 10 digit mobile number."
        );
      }

      if (!email) {
        throw new Error(
          "Technician email is required."
        );
      }

      if (!password) {
        throw new Error(
          "Technician password is required."
        );
      }

      if (
        password.length < 6
      ) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      const duplicate =
        savedTechnicians.some(
          (item) =>
            normalizeText(
              item.name
            ) ===
              normalizeText(
                name
              ) ||
            cleanPhone(
              item.phone
            ) === phone ||
            normalizeText(
              item.email
            ) ===
              normalizeText(
                email
              )
        );

      if (duplicate) {
        throw new Error(
          "Technician with same name, phone or email already exists."
        );
      }

      let newUserId;

      try {
        const {
          initializeApp,
          getApps,
        } = await import(
          "firebase/app"
        );

        const {
          getAuth,
          createUserWithEmailAndPassword,
          signOut,
        } = await import(
          "firebase/auth"
        );

        const currentApp =
          auth.app;

        const secondaryAppName =
          "SecondaryAppForTechCreation";

        let secondaryApp =
          getApps().find(
            (app) =>
              app.name ===
              secondaryAppName
          );

        if (!secondaryApp) {
          secondaryApp =
            initializeApp(
              currentApp.options,
              secondaryAppName
            );
        }

        const secondaryAuth =
          getAuth(
            secondaryApp
          );

        const userCredential =
          await createUserWithEmailAndPassword(
            secondaryAuth,
            email,
            password || "Ansar@123"
          );

        newUserId =
          userCredential.user.uid;

        await signOut(
          secondaryAuth
        );
      } catch (authError) {
        console.warn("Secondary auth notice:", authError);
        newUserId = `tech_${Date.now()}`;
      }

      if (!newUserId) {
        newUserId = `tech_${Date.now()}`;
      }

      try {
        /* ================= USERS ================= */

        await setDoc(
          doc(
            db,
            "users",
            newUserId
          ),
          {
            uid:
              newUserId,

            authUid:
              newUserId,

            userId:
              newUserId,

            role:
              "technician",

            status:
              "active",

            name,

            fullName:
              name,

            technicianName:
              name,

            phone,

            phoneNormalized:
              `+91${phone}`,

            email,

            specialization,

            presenceStatus:
              "absent",

            attendanceDate:
              "",

            availabilityStatus:
              "Off Duty",

            currentJobId:
              null,

            loginEnabled:
              true,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        /* ================= TECHNICIANS ================= */

        await setDoc(
          doc(
            db,
            "technicians",
            newUserId
          ),
          {
            uid:
              newUserId,

            authUid:
              newUserId,

            userId:
              newUserId,

            name,

            phone,

            phoneNormalized:
              `+91${phone}`,

            email,

            specialization,

            status,

            availabilityStatus:
              "Off Duty",

            role:
              "technician",

            loginEnabled:
              true,

            currentJobId:
              null,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        const createdTech = {
          id: newUserId,
          uid: newUserId,
          authUid: newUserId,
          documentId: newUserId,
          name,
          fullName: name,
          technicianName: name,
          phone,
          email,
          specialization,
          status,
          availabilityStatus: "Off Duty",
          role: "technician",
          loginEnabled: true,
          presenceStatus: "absent",
        };

        setUserTechnicians((prev) => [createdTech, ...prev]);
        setProfileTechnicians((prev) => [createdTech, ...prev]);

        return true;
      } catch (error) {
        console.error(
          "Error creating technician:",
          error
        );

        if (
          error?.code ===
          "auth/email-already-in-use"
        ) {
          throw new Error(
            "This email already has an account."
          );
        }

        if (
          error?.code ===
          "auth/invalid-email"
        ) {
          throw new Error(
            "Enter a valid email address."
          );
        }

        if (
          error?.code ===
          "auth/weak-password"
        ) {
          throw new Error(
            "Password is too weak. Use at least 6 characters."
          );
        }

        throw new Error(
          error?.message ||
            "Failed to create technician account."
        );
      }
    };

  /* =========================================================
     UPDATE TECHNICIAN
  ========================================================= */

  const handleUpdateTechnician =
    async (
      updatedTechnician
    ) => {
      if (
        !selectedTechnician?.id
      ) {
        return;
      }

      const technicianUid =
        selectedTechnician.uid ||
        selectedTechnician.authUid ||
        selectedTechnician.id;

      const technicianDocumentId =
        selectedTechnician.documentId ||
        technicianUid;

      const name =
        String(
          updatedTechnician.name ||
            ""
        ).trim();

      const phone =
        cleanPhone(
          updatedTechnician.phone
        );

      const specialization =
        String(
          updatedTechnician.specialization ||
            "General Repair"
        ).trim();

      const status =
        updatedTechnician.staffStatus ||
        updatedTechnician.status ||
        "Active";

      if (!name) {
        alert(
          "Technician name is required."
        );

        return;
      }

      if (
        phone.length !== 10
      ) {
        alert(
          "Enter a valid mobile number."
        );

        return;
      }

      const duplicate =
        savedTechnicians.some(
          (item) => {
            if (
              item.id ===
              selectedTechnician.id
            ) {
              return false;
            }

            return (
              normalizeText(
                item.name
              ) ===
                normalizeText(
                  name
                ) ||
              cleanPhone(
                item.phone
              ) ===
                phone
            );
          }
        );

      if (duplicate) {
        alert(
          "Another technician already uses this name or number."
        );

        return;
      }

      try {
        await setDoc(
          doc(
            db,
            "technicians",
            technicianDocumentId
          ),
          {
            uid:
              technicianUid,

            authUid:
              technicianUid,

            userId:
              technicianUid,

            name,

            phone,

            phoneNormalized:
              `+91${phone}`,

            specialization,

            status,

            loginEnabled:
              status !==
              "Inactive",

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        await setDoc(
          doc(
            db,
            "users",
            technicianUid
          ),
          {
            uid:
              technicianUid,

            authUid:
              technicianUid,

            userId:
              technicianUid,

            name,

            fullName:
              name,

            technicianName:
              name,

            phone,

            phoneNormalized:
              `+91${phone}`,

            specialization,

            status:
              status ===
              "Inactive"
                ? "inactive"
                : "active",

            loginEnabled:
              status !==
              "Inactive",

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        /* =================================================
           UPDATE JOB DISPLAY NAME

           UID does NOT change.
        ================================================= */

        const matchingJobs =
          jobs.filter(
            (job) => {
              const possibleIds =
                [
                  job.technicianId,
                  job.technicianUid,
                  job.assignedTechnicianId,
                  job.assignedToId,
                ]
                  .filter(Boolean)
                  .map(String);

              return possibleIds.includes(
                String(
                  technicianUid
                )
              );
            }
          );

        await Promise.all(
          matchingJobs.map(
            (job) =>
              updateDoc(
                doc(
                  db,
                  "repairJobs",
                  job.id
                ),
                {
                  technician:
                    name,

                  technicianName:
                    name,

                  updatedAt:
                    serverTimestamp(),
                }
              )
          )
        );

        setIsDetailsOpen(
          false
        );

        setSelectedTechnician(
          null
        );
      } catch (error) {
        console.error(
          "Technician update failed:",
          error
        );

        alert(
          "Unable to update technician."
        );
      }
    };

  /* =========================================================
     DELETE TECHNICIAN
  ========================================================= */

  const handleDeleteTechnician =
    async (
      technician
    ) => {
      if (
        !technician?.id
      ) {
        return;
      }

      const technicianUid =
        technician.uid ||
        technician.authUid ||
        technician.id;

      const technicianDocumentId =
        technician.documentId ||
        technicianUid;

      try {
        // Delete from 'technicians' collection
        if (technicianDocumentId) {
          try {
            await deleteDoc(
              doc(
                db,
                "technicians",
                technicianDocumentId
              )
            );
          } catch (delErr) {
            console.warn("Delete from technicians error:", delErr);
          }
        }

        if (technicianUid && technicianUid !== technicianDocumentId) {
          try {
            await deleteDoc(
              doc(
                db,
                "technicians",
                technicianUid
              )
            );
          } catch (delErr) {
            console.warn("Delete from technicians (uid) error:", delErr);
          }
        }

        // Delete from 'users' collection
        if (technicianUid) {
          try {
            await deleteDoc(
              doc(
                db,
                "users",
                technicianUid
              )
            );
          } catch (delErr) {
            console.warn("Delete from users error:", delErr);
          }
        }

        // Immediately update local state so UI updates in real-time
        setUserTechnicians((prev) =>
          prev.filter(
            (t) =>
              (t.uid || t.id) !== technicianUid &&
              t.id !== technician.id
          )
        );

        setProfileTechnicians((prev) =>
          prev.filter(
            (t) =>
              (t.documentId || t.uid || t.id) !== technicianDocumentId &&
              t.id !== technician.id &&
              t.uid !== technicianUid
          )
        );

        setIsDetailsOpen(
          false
        );

        setSelectedTechnician(
          null
        );
      } catch (error) {
        console.error(
          "Technician delete failed:",
          error
        );

        alert(
          "Unable to delete technician: " + (error?.message || "Check network connection.")
        );
      }
    };

  /* =========================================================
     JOB MATCH

     UID FIRST.
     NAME FALLBACK ONLY IF OLD JOB HAS NO UID.
  ========================================================= */

  const getJobsForTechnician =
    (technician) => {
      const technicianUid =
        String(
          technician.uid ||
            technician.authUid ||
            technician.id ||
            ""
        );

      const technicianName =
        normalizeText(
          technician.name
        );

      return jobs.filter(
        (job) => {
          const possibleIds =
            [
              job.technicianId,
              job.technicianUid,
              job.assignedTechnicianId,
              job.assignedToId,
              job.userId,
            ]
              .filter(Boolean)
              .map(String);

          if (
            possibleIds.length >
            0
          ) {
            return (
              technicianUid &&
              possibleIds.includes(
                technicianUid
              )
            );
          }

          const possibleNames =
            [
              job.technician,
              job.technicianName,
              job.assignedTo,
              job.assignedTechnician,
            ]
              .filter(Boolean)
              .map(
                normalizeText
              );

          return (
            technicianName &&
            possibleNames.includes(
              technicianName
            )
          );
        }
      );
    };

  /* =========================================================
     CALCULATED TECHNICIANS
  ========================================================= */

  const technicians =
    useMemo(() => {
      return savedTechnicians.map(
        (staff) => {
          const technicianJobs =
            getJobsForTechnician(
              staff
            );

          let activeJobs = 0;
          let pendingJobs = 0;
          let inProgressJobs = 0;
          let pausedJobs = 0;
          let readyJobs = 0;
          let completedJobs = 0;
          let batteryJobs = 0;

          let totalBilled = 0;
          let totalReceived = 0;
          let totalPending = 0;

          technicianJobs.forEach(
            (job) => {
              const amount =
                Number(
                  job.amount ??
                    job.estimatedCharge ??
                    job.totalAmount ??
                    0
                ) || 0;

              const advance =
                Number(
                  job.advance ??
                    job.advanceReceived ??
                    0
                ) || 0;

              totalBilled +=
                amount;

              totalReceived +=
                advance;

              totalPending +=
                Math.max(
                  amount -
                    advance,
                  0
                );

              if (
                [
                  "Pending",
                  "In Progress",
                  "Paused",
                  "Ready",
                ].includes(
                  job.status
                )
              ) {
                activeJobs += 1;
              }

              if (
                job.status ===
                "Pending"
              ) {
                pendingJobs += 1;
              }

              if (
                job.status ===
                "In Progress"
              ) {
                inProgressJobs +=
                  1;
              }

              if (
                job.status ===
                "Paused"
              ) {
                pausedJobs += 1;
              }

              if (
                job.status ===
                "Ready"
              ) {
                readyJobs += 1;
              }

              if (
                job.status ===
                "Completed"
              ) {
                completedJobs +=
                  1;
              }

              if (
                job.batteryUsed &&
                job.battery
              ) {
                batteryJobs += 1;
              }
            }
          );

          return {
            ...staff,

            staffStatus:
              staff.status ||
              "Active",

            totalJobs:
              technicianJobs.length,

            activeJobs,
            pendingJobs,
            inProgressJobs,
            pausedJobs,
            readyJobs,
            completedJobs,
            batteryJobs,

            totalBilled,
            totalReceived,
            totalPending,

            jobs:
              technicianJobs,
          };
        }
      );
    }, [
      savedTechnicians,
      jobs,
    ]);

  /* =========================================================
     PAGE STATS
  ========================================================= */

  const stats =
    useMemo(() => {
      const activeTechnicians =
        technicians.filter(
          (
            technician
          ) =>
            technician.staffStatus ===
              "Active" &&
            technician.activeJobs >
              0
        ).length;

      return {
        totalTechnicians:
          technicians.length,

        activeTechnicians,

        completedJobs:
          technicians.reduce(
            (
              total,
              technician
            ) =>
              total +
              technician.completedJobs,
            0
          ),

        billedValue:
          technicians.reduce(
            (
              total,
              technician
            ) =>
              total +
              technician.totalBilled,
            0
          ),
      };
    }, [technicians]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredTechnicians =
    useMemo(() => {
      const query =
        normalizeText(
          searchQuery
        );

      if (!query) {
        return technicians;
      }

      return technicians.filter(
        (
          technician
        ) =>
          [
            technician.name,
            technician.phone,
            technician.email,
            technician.specialization,
            technician.staffStatus,
            technician.availabilityStatus,
          ].some(
            (value) =>
              normalizeText(
                value
              ).includes(
                query
              )
          )
      );
    }, [
      technicians,
      searchQuery,
    ]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="technicians-page">

      {/* HEADER */}

      <div className="technicians-header">

        <div>
          <span className="technicians-eyebrow">
            Team Operations
          </span>

          <h1>
            Technicians
          </h1>

          <p>
            Monitor technician workload,
            assigned repairs and performance.
          </p>
        </div>

        <button
          type="button"
          className="add-technician-btn"
          onClick={() =>
            setIsAddOpen(
              true
            )
          }
        >
          <UserPlus
            size={17}
          />

          <span>
            Add Technician
          </span>
        </button>

      </div>

      {/* ERROR */}

      {firebaseError && (
        <div
          style={{
            marginBottom:
              "15px",

            padding:
              "11px 14px",

            border:
              "1px solid #fde2e2",

            borderRadius:
              "10px",

            background:
              "#fff8f8",

            color:
              "#b42318",

            fontSize:
              "11px",
          }}
        >
          {firebaseError}
        </div>
      )}

      {/* STATS */}

      <div className="technicians-stats-grid">

        <div className="technicians-stat-card">

          <div className="technicians-stat-icon blue">
            <Users
              size={21}
            />
          </div>

          <div>
            <span>
              Total Technicians
            </span>

            <strong>
              {
                stats.totalTechnicians
              }
            </strong>
          </div>

        </div>

        <div className="technicians-stat-card">

          <div className="technicians-stat-icon orange">
            <Activity
              size={21}
            />
          </div>

          <div>
            <span>
              Active Technicians
            </span>

            <strong>
              {
                stats.activeTechnicians
              }
            </strong>
          </div>

        </div>

        <div className="technicians-stat-card">

          <div className="technicians-stat-icon green">
            <CheckCircle2
              size={21}
            />
          </div>

          <div>
            <span>
              Completed Jobs
            </span>

            <strong>
              {
                stats.completedJobs
              }
            </strong>
          </div>

        </div>

        <div className="technicians-stat-card">

          <div className="technicians-stat-icon purple">
            <IndianRupee
              size={21}
            />
          </div>

          <div>
            <span>
              Assigned Job Value
            </span>

            <strong>
              ₹
              {stats.billedValue.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* TABLE CARD */}

      <section className="technicians-card">

        <div className="technicians-toolbar">

          <div className="technicians-search">

            <Search
              size={18}
            />

            <input
              type="text"
              value={
                searchQuery
              }
              onChange={(
                event
              ) =>
                setSearchQuery(
                  event.target
                    .value
                )
              }
              placeholder="Search technician, phone or specialization..."
            />

          </div>

          <div className="technicians-result-count">
            {firebaseLoading
              ? "Syncing..."
              : `${filteredTechnicians.length} technicians`}
          </div>

        </div>

        {/* DESKTOP */}

        <div className="technicians-table-wrap">

          <table className="technicians-table">

            <thead>
              <tr>
                <th>
                  Technician
                </th>

                <th>
                  Workload
                </th>

                <th>
                  In Progress
                </th>

                <th>
                  Ready
                </th>

                <th>
                  Completed
                </th>

                <th>
                  Battery Jobs
                </th>

                <th>
                  Job Value
                </th>

                <th>
                  Pending Payment
                </th>

                <th />
              </tr>
            </thead>

            <tbody>

              {filteredTechnicians.map(
                (
                  technician
                ) => (
                  <tr
                    key={
                      technician.id
                    }
                  >

                    <td>
                      <div className="technician-person">

                        <div className="technician-avatar">
                          <UserCog
                            size={17}
                          />
                        </div>

                        <div>
                          <strong>
                            {
                              technician.name
                            }
                          </strong>

                          <span
                            className={getWorkStatusClass(
                              technician.activeJobs,
                              technician.staffStatus,
                              technician.availabilityStatus
                            )}
                          >
                            {getStatusLabel(
                              technician
                            )}
                          </span>

                          <small className="technician-specialization">
                            {
                              technician.specialization
                            }
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <div className="technician-workload">

                        <strong>
                          {
                            technician.activeJobs
                          }
                        </strong>

                        <span>
                          of{" "}
                          {
                            technician.totalJobs
                          }{" "}
                          jobs
                        </span>

                      </div>
                    </td>

                    <td>
                      <span className="technician-count-badge progress">
                        {
                          technician.inProgressJobs
                        }
                      </span>
                    </td>

                    <td>
                      <span className="technician-count-badge ready">
                        {
                          technician.readyJobs
                        }
                      </span>
                    </td>

                    <td>
                      <span className="technician-count-badge completed">
                        {
                          technician.completedJobs
                        }
                      </span>
                    </td>

                    <td>
                      <div className="technician-battery-count">

                        <PackageCheck
                          size={14}
                        />

                        <strong>
                          {
                            technician.batteryJobs
                          }
                        </strong>

                      </div>
                    </td>

                    <td>
                      <strong>
                        ₹
                        {technician.totalBilled.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <strong
                        className={
                          technician.totalPending >
                          0
                            ? "technician-pending-money"
                            : "technician-clear-money"
                        }
                      >
                        ₹
                        {technician.totalPending.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="technician-view-btn"
                        onClick={() => {
                          setSelectedTechnician(
                            technician
                          );

                          setIsDetailsOpen(
                            true
                          );
                        }}
                      >
                        <ChevronRight
                          size={17}
                        />
                      </button>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

        {/* MOBILE */}

        <div className="technicians-mobile-list">

          {filteredTechnicians.map(
            (
              technician
            ) => (
              <article
                className="technicians-mobile-card"
                key={
                  technician.id
                }
              >

                <div className="technicians-mobile-top">

                  <div className="technician-person">

                    <div className="technician-avatar">
                      <UserCog
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        {
                          technician.name
                        }
                      </strong>

                      <span
                        className={getWorkStatusClass(
                          technician.activeJobs,
                          technician.staffStatus,
                          technician.availabilityStatus
                        )}
                      >
                        {getStatusLabel(
                          technician
                        )}
                      </span>

                      <small className="technician-specialization">
                        {
                          technician.specialization
                        }
                      </small>
                    </div>

                  </div>

                  <div className="technicians-mobile-workload">

                    <strong>
                      {
                        technician.activeJobs
                      }
                    </strong>

                    <span>
                      Active
                    </span>

                  </div>

                </div>

                <div className="technicians-mobile-grid">

                  <div>
                    <span>
                      In Progress
                    </span>

                    <strong>
                      {
                        technician.inProgressJobs
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Ready
                    </span>

                    <strong>
                      {
                        technician.readyJobs
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Completed
                    </span>

                    <strong>
                      {
                        technician.completedJobs
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Battery Jobs
                    </span>

                    <strong>
                      {
                        technician.batteryJobs
                      }
                    </strong>
                  </div>

                </div>

                <div className="technicians-mobile-money">

                  <div>
                    <span>
                      Assigned Value
                    </span>

                    <strong>
                      ₹
                      {technician.totalBilled.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pending
                    </span>

                    <strong>
                      ₹
                      {technician.totalPending.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

                <button
                  type="button"
                  className="technician-mobile-view-btn"
                  onClick={() => {
                    setSelectedTechnician(
                      technician
                    );

                    setIsDetailsOpen(
                      true
                    );
                  }}
                >
                  View Technician

                  <ChevronRight
                    size={16}
                  />
                </button>

              </article>
            )
          )}

        </div>

        {!firebaseLoading &&
          filteredTechnicians.length ===
            0 && (
            <div className="technicians-empty-state">

              <Wrench
                size={32}
              />

              <h3>
                No technicians found
              </h3>

              <p>
                Add your first technician
                to start assigning repair jobs.
              </p>

            </div>
          )}

      </section>

      {/* ADD TECHNICIAN */}

      <AddTechnicianModal
        isOpen={
          isAddOpen
        }
        onClose={() =>
          setIsAddOpen(
            false
          )
        }
        onCreateTechnician={
          handleCreateTechnician
        }
      />

      {/* DETAILS */}

      <TechnicianDetailsModal
        isOpen={
          isDetailsOpen
        }
        technician={
          selectedTechnician
        }
        onClose={() => {
          setIsDetailsOpen(
            false
          );

          setSelectedTechnician(
            null
          );
        }}
        onUpdateTechnician={
          handleUpdateTechnician
        }
        onDeleteTechnician={
          handleDeleteTechnician
        }
      />

    </div>
  );
};

export default Technicians;