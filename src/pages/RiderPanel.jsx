import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bike,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  RefreshCcw,
  Route,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase/firebase";

import "../styles/riderPanel.css";

/* =========================================================
   ANSAR TELECOM
   RIDER PANEL

   Logistics status only.

   Repair lifecycle remains controlled by
   Reception / Technician / Owner.
========================================================= */

const TASK_STATUS = {
  RIDER_ASSIGNED: "rider_assigned",
  RIDER_ACCEPTED: "rider_accepted",

  GOING_TO_CUSTOMER:
    "rider_on_the_way",

  RIDER_ARRIVED:
    "rider_arrived",

  PICKED_UP:
    "picked_up",

  GOING_TO_SHOP:
    "going_to_shop",

  AT_SHOP:
    "at_shop",

  RECEIVED_AT_SHOP:
    "received_at_shop",

  DELIVERY_RIDER_ASSIGNED:
    "delivery_rider_assigned",

  DELIVERY_ACCEPTED:
    "delivery_accepted",

  OUT_FOR_DELIVERY:
    "out_for_delivery",

  DELIVERY_ARRIVED:
    "delivery_arrived",

  DELIVERED:
    "delivered",
};

const NEW_STATUSES = [
  TASK_STATUS.RIDER_ASSIGNED,
  TASK_STATUS.DELIVERY_RIDER_ASSIGNED,
];

const ACTIVE_STATUSES = [
  TASK_STATUS.RIDER_ACCEPTED,
  TASK_STATUS.GOING_TO_CUSTOMER,
  TASK_STATUS.RIDER_ARRIVED,
  TASK_STATUS.PICKED_UP,
  TASK_STATUS.GOING_TO_SHOP,
  TASK_STATUS.AT_SHOP,

  TASK_STATUS.DELIVERY_ACCEPTED,
  TASK_STATUS.OUT_FOR_DELIVERY,
  TASK_STATUS.DELIVERY_ARRIVED,
];

const COMPLETED_STATUSES = [
  TASK_STATUS.RECEIVED_AT_SHOP,
  TASK_STATUS.DELIVERED,
];

const normalizePhone = (value = "") => {
  let digits = String(value)
    .replace(/\D/g, "");

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    digits = digits.slice(2);
  }

  if (
    digits.length === 11 &&
    digits.startsWith("0")
  ) {
    digits = digits.slice(1);
  }

  return digits.slice(-10);
};

const getCustomerName = (task = {}) => {
  if (
    typeof task.customer === "object" &&
    task.customer
  ) {
    return (
      task.customer.name ||
      task.customer.customerName ||
      "Customer"
    );
  }

  return (
    task.customerName ||
    task.customer ||
    "Customer"
  );
};

const getCustomerPhone = (task = {}) => {
  if (
    typeof task.customer === "object" &&
    task.customer
  ) {
    return normalizePhone(
      task.customer.phone ||
        task.customer.mobile ||
        task.customer.phoneNumber ||
        ""
    );
  }

  return normalizePhone(
    task.phone ||
      task.customerPhone ||
      task.mobile ||
      task.phoneNumber ||
      ""
  );
};

const getDeviceName = (task = {}) => {
  const brand =
    task.deviceBrand ||
    task.brand ||
    "";

  const model =
    task.deviceModel ||
    task.model ||
    "";

  if (brand || model) {
    return `${brand} ${model}`.trim();
  }

  if (
    typeof task.device === "object" &&
    task.device
  ) {
    return (
      `${task.device.brand || ""} ${
        task.device.model || ""
      }`.trim() ||
      "Mobile Device"
    );
  }

  return (
    task.device ||
    "Mobile Device"
  );
};

const getAddress = (task = {}) => {
  if (
    typeof task.pickupAddress ===
      "object" &&
    task.pickupAddress
  ) {
    return [
      task.pickupAddress.address,
      task.pickupAddress.landmark,
      task.pickupAddress.pincode,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return (
    task.address ||
    task.pickupAddress ||
    task.customerAddress ||
    "Pickup address unavailable"
  );
};

const getCoordinates = (task = {}) => {
  const location =
    task.pickupLocation ||
    task.location ||
    {};

  const latitude =
    Number(
      location.latitude ??
        location.lat ??
        task.latitude
    );

  const longitude =
    Number(
      location.longitude ??
        location.lng ??
        task.longitude
    );

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return {
      latitude,
      longitude,
    };
  }

  return null;
};

const isDeliveryTask = (task = {}) => {
  const status =
    String(task.status || "")
      .trim()
      .toLowerCase();

  return (
    task.taskType === "delivery" ||
    status.includes("delivery") ||
    status ===
      TASK_STATUS.OUT_FOR_DELIVERY ||
    status ===
      TASK_STATUS.DELIVERED
  );
};

const getStatusLabel = (
  status = ""
) => {
  const labels = {
    [TASK_STATUS.RIDER_ASSIGNED]:
      "New Pickup",

    [TASK_STATUS.RIDER_ACCEPTED]:
      "Pickup Accepted",

    [TASK_STATUS.GOING_TO_CUSTOMER]:
      "Going to Customer",

    [TASK_STATUS.RIDER_ARRIVED]:
      "Arrived at Customer",

    [TASK_STATUS.PICKED_UP]:
      "Device Picked Up",

    [TASK_STATUS.GOING_TO_SHOP]:
      "Going to Shop",

    [TASK_STATUS.AT_SHOP]:
      "At Ansar Telecom",

    [TASK_STATUS.RECEIVED_AT_SHOP]:
      "Handed to Reception",

    [TASK_STATUS.DELIVERY_RIDER_ASSIGNED]:
      "New Delivery",

    [TASK_STATUS.DELIVERY_ACCEPTED]:
      "Delivery Accepted",

    [TASK_STATUS.OUT_FOR_DELIVERY]:
      "Out for Delivery",

    [TASK_STATUS.DELIVERY_ARRIVED]:
      "Arrived for Delivery",

    [TASK_STATUS.DELIVERED]:
      "Delivered",
  };

  return (
    labels[status] ||
    String(status || "Unknown")
      .replaceAll("_", " ")
  );
};

const getNextAction = (task = {}) => {
  const status =
    String(task.status || "")
      .trim()
      .toLowerCase();

  switch (status) {
    case TASK_STATUS.RIDER_ASSIGNED:
      return {
        label: "Accept Pickup",
        nextStatus:
          TASK_STATUS.RIDER_ACCEPTED,
        icon: Check,
      };

    case TASK_STATUS.RIDER_ACCEPTED:
      return {
        label: "Start Journey",
        nextStatus:
          TASK_STATUS.GOING_TO_CUSTOMER,
        icon: Navigation,
      };

    case TASK_STATUS.GOING_TO_CUSTOMER:
      return {
        label: "I've Arrived",
        nextStatus:
          TASK_STATUS.RIDER_ARRIVED,
        icon: MapPin,
      };

    case TASK_STATUS.RIDER_ARRIVED:
      return {
        label: "Confirm Device Pickup",
        nextStatus:
          TASK_STATUS.PICKED_UP,
        icon: PackageCheck,
      };

    case TASK_STATUS.PICKED_UP:
      return {
        label: "Start Journey to Shop",
        nextStatus:
          TASK_STATUS.GOING_TO_SHOP,
        icon: Store,
      };

    case TASK_STATUS.GOING_TO_SHOP:
      return {
        label: "Reached Ansar Telecom",
        nextStatus:
          TASK_STATUS.AT_SHOP,
        icon: Store,
      };

    case TASK_STATUS.AT_SHOP:
      return {
        label: "Handover to Reception",
        nextStatus:
          TASK_STATUS.RECEIVED_AT_SHOP,
        icon: PackageCheck,
      };

    case TASK_STATUS.DELIVERY_RIDER_ASSIGNED:
      return {
        label: "Accept Delivery",
        nextStatus:
          TASK_STATUS.DELIVERY_ACCEPTED,
        icon: Check,
      };

    case TASK_STATUS.DELIVERY_ACCEPTED:
      return {
        label: "Start Delivery",
        nextStatus:
          TASK_STATUS.OUT_FOR_DELIVERY,
        icon: Truck,
      };

    case TASK_STATUS.OUT_FOR_DELIVERY:
      return {
        label: "I've Arrived",
        nextStatus:
          TASK_STATUS.DELIVERY_ARRIVED,
        icon: MapPin,
      };

    case TASK_STATUS.DELIVERY_ARRIVED:
      return {
        label: "Confirm Delivery",
        nextStatus:
          TASK_STATUS.DELIVERED,
        icon: PackageCheck,
      };

    default:
      return null;
  }
};

const RiderPanel = () => {
  const [currentUser, setCurrentUser] =
    useState(null);

  const [rider, setRider] =
    useState(null);

  const [tasks, setTasks] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState("new");

  const [loading, setLoading] =
    useState(true);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState("");

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  /* =======================================================
     AUTH
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user || null);

          if (!user) {
            setLoading(false);
            setProfileLoading(false);
          }
        }
      );

    return unsubscribe;
  }, []);

  /* =======================================================
     RIDER PROFILE
  ======================================================= */

  useEffect(() => {
    if (!currentUser?.uid) {
      return undefined;
    }

    setProfileLoading(true);

    const riderReference =
      doc(
        db,
        "riders",
        currentUser.uid
      );

    const unsubscribe =
      onSnapshot(
        riderReference,
        (snapshot) => {
          if (snapshot.exists()) {
            setRider({
              id: snapshot.id,
              ...snapshot.data(),
            });
          } else {
            setRider({
              id: currentUser.uid,
              name:
                currentUser.displayName ||
                currentUser.email ||
                "Rider",
              status: "active",
              availabilityStatus:
                "Available",
            });
          }

          setProfileLoading(false);
        },
        (snapshotError) => {
          console.error(
            "Unable to load rider:",
            snapshotError
          );

          setError(
            "Unable to load rider profile."
          );

          setProfileLoading(false);
        }
      );

    return unsubscribe;
  }, [currentUser]);

  /* =======================================================
     ASSIGNED PICKUP / DELIVERY TASKS

     We intentionally listen using rider UID.

     pickup assignment:
       assignedRiderId

     delivery assignment:
       deliveryRiderId
  ======================================================= */

  useEffect(() => {
    if (!currentUser?.uid) {
      return undefined;
    }

    setLoading(true);
    setError("");

    const pickupMap = new Map();
    const deliveryMap = new Map();

    const syncTasks = () => {
      const merged = new Map();

      pickupMap.forEach(
        (value, key) => {
          merged.set(key, value);
        }
      );

      deliveryMap.forEach(
        (value, key) => {
          merged.set(key, {
            ...(merged.get(key) || {}),
            ...value,
          });
        }
      );

      const result =
        Array.from(
          merged.values()
        ).sort((a, b) => {
          const aTime =
            a.updatedAt?.toMillis?.() ||
            a.createdAt?.toMillis?.() ||
            0;

          const bTime =
            b.updatedAt?.toMillis?.() ||
            b.createdAt?.toMillis?.() ||
            0;

          return bTime - aTime;
        });

      setTasks(result);
      setLoading(false);
    };

    const pickupQuery =
      query(
        collection(
          db,
          "pickupRequests"
        ),
        where(
          "assignedRiderId",
          "==",
          currentUser.uid
        )
      );

    const deliveryQuery =
      query(
        collection(
          db,
          "pickupRequests"
        ),
        where(
          "deliveryRiderId",
          "==",
          currentUser.uid
        )
      );

    const unsubscribePickup =
      onSnapshot(
        pickupQuery,
        (snapshot) => {
          pickupMap.clear();

          snapshot.docs.forEach(
            (documentSnapshot) => {
              pickupMap.set(
                documentSnapshot.id,
                {
                  id:
                    documentSnapshot.id,
                  ...documentSnapshot.data(),
                }
              );
            }
          );

          syncTasks();
        },
        (snapshotError) => {
          console.error(
            "Pickup rider query error:",
            snapshotError
          );

          setError(
            "Unable to load pickup assignments."
          );

          setLoading(false);
        }
      );

    const unsubscribeDelivery =
      onSnapshot(
        deliveryQuery,
        (snapshot) => {
          deliveryMap.clear();

          snapshot.docs.forEach(
            (documentSnapshot) => {
              deliveryMap.set(
                documentSnapshot.id,
                {
                  id:
                    documentSnapshot.id,
                  ...documentSnapshot.data(),
                  taskType:
                    "delivery",
                }
              );
            }
          );

          syncTasks();
        },
        (snapshotError) => {
          console.error(
            "Delivery rider query error:",
            snapshotError
          );

          setError(
            "Unable to load delivery assignments."
          );

          setLoading(false);
        }
      );

    return () => {
      unsubscribePickup();
      unsubscribeDelivery();
    };
  }, [currentUser]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    let newCount = 0;
    let activeCount = 0;
    let completedCount = 0;

    tasks.forEach((task) => {
      const status =
        String(task.status || "")
          .trim()
          .toLowerCase();

      if (
        NEW_STATUSES.includes(status)
      ) {
        newCount += 1;
      } else if (
        ACTIVE_STATUSES.includes(status)
      ) {
        activeCount += 1;
      } else if (
        COMPLETED_STATUSES.includes(
          status
        )
      ) {
        completedCount += 1;
      }
    });

    return {
      new: newCount,
      active: activeCount,
      completed: completedCount,
    };
  }, [tasks]);

  const visibleTasks =
    useMemo(() => {
      return tasks.filter((task) => {
        const status =
          String(task.status || "")
            .trim()
            .toLowerCase();

        if (activeTab === "new") {
          return NEW_STATUSES.includes(
            status
          );
        }

        if (activeTab === "active") {
          return ACTIVE_STATUSES.includes(
            status
          );
        }

        return COMPLETED_STATUSES.includes(
          status
        );
      });
    }, [tasks, activeTab]);

  /* =======================================================
     UPDATE TASK STATUS
  ======================================================= */

  const updateTaskStatus =
    async (
      task,
      nextStatus
    ) => {
      if (
        !task?.id ||
        !nextStatus
      ) {
        return;
      }

      setUpdatingId(task.id);
      setError("");

      try {
        const taskReference =
          doc(
            db,
            "pickupRequests",
            task.id
          );

        const payload = {
          status: nextStatus,
          updatedAt:
            serverTimestamp(),

          lastRiderAction: {
            status: nextStatus,
            riderId:
              currentUser?.uid || "",
            riderName:
              rider?.name ||
              currentUser?.displayName ||
              "Rider",
            timestamp:
              new Date().toISOString(),
          },
        };

        if (
          nextStatus ===
          TASK_STATUS.RIDER_ACCEPTED
        ) {
          payload.riderAcceptedAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.GOING_TO_CUSTOMER
        ) {
          payload.pickupJourneyStartedAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.RIDER_ARRIVED
        ) {
          payload.riderArrivedAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.PICKED_UP
        ) {
          payload.pickedUpAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.GOING_TO_SHOP
        ) {
          payload.shopJourneyStartedAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.AT_SHOP
        ) {
          payload.arrivedAtShopAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.RECEIVED_AT_SHOP
        ) {
          /*
           This is currently rider-side
           handover status.

           Reception confirmation will be
           separated in the next integration.
          */

          payload.riderHandoverAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.DELIVERY_ACCEPTED
        ) {
          payload.deliveryAcceptedAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.OUT_FOR_DELIVERY
        ) {
          payload.outForDeliveryAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.DELIVERY_ARRIVED
        ) {
          payload.deliveryArrivedAt =
            serverTimestamp();
        }

        if (
          nextStatus ===
          TASK_STATUS.DELIVERED
        ) {
          payload.deliveredAt =
            serverTimestamp();
        }

        await updateDoc(
          taskReference,
          payload
        );

        if (
          NEW_STATUSES.includes(
            String(task.status || "")
              .toLowerCase()
          )
        ) {
          setActiveTab("active");
        }
      } catch (updateError) {
        console.error(
          "Unable to update rider task:",
          updateError
        );

        setError(
          "Unable to update this task. Please try again."
        );
      } finally {
        setUpdatingId("");
      }
    };

  /* =======================================================
     RIDER ONLINE / OFFLINE
  ======================================================= */

  const toggleAvailability =
    async () => {
      if (!currentUser?.uid) {
        return;
      }

      try {
        const riderReference =
          doc(
            db,
            "riders",
            currentUser.uid
          );

        const currentlyOnline =
          rider?.isOnline === true;

        await updateDoc(
          riderReference,
          {
            isOnline:
              !currentlyOnline,

            availabilityStatus:
              currentlyOnline
                ? "Offline"
                : "Available",

            lastStatusChangeAt:
              serverTimestamp(),
          }
        );
      } catch (availabilityError) {
        console.error(
          "Unable to change rider status:",
          availabilityError
        );

        setError(
          "Unable to change online status."
        );
      }
    };

  /* =======================================================
     CURRENT GPS SNAPSHOT

     Full continuous live tracking comes in
     the next backend/live-map phase.
  ======================================================= */

  const updateCurrentLocation =
    () => {
      if (
        !navigator.geolocation ||
        !currentUser?.uid
      ) {
        setError(
          "Location is not supported on this device."
        );
        return;
      }

      setLocationLoading(true);
      setError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            await updateDoc(
              doc(
                db,
                "riders",
                currentUser.uid
              ),
              {
                currentLocation: {
                  latitude,
                  longitude,
                  accuracy:
                    position.coords
                      .accuracy || null,
                },

                lastLocationAt:
                  serverTimestamp(),
              }
            );
          } catch (locationError) {
            console.error(
              "Unable to save rider location:",
              locationError
            );

            setError(
              "Unable to save current location."
            );
          } finally {
            setLocationLoading(false);
          }
        },

        (locationError) => {
          console.error(
            "GPS error:",
            locationError
          );

          setError(
            "Location permission is required for rider tracking."
          );

          setLocationLoading(false);
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    };

  /* =======================================================
     NAVIGATION / CALL
  ======================================================= */

  const callCustomer = (task) => {
    const phone =
      getCustomerPhone(task);

    if (!phone) {
      setError(
        "Customer phone number is unavailable."
      );
      return;
    }

    window.location.href =
      `tel:+91${phone}`;
  };

  const openNavigation = (task) => {
    const coordinates =
      getCoordinates(task);

    const address =
      getAddress(task);

    let destination = "";

    if (coordinates) {
      destination =
        `${coordinates.latitude},${coordinates.longitude}`;
    } else {
      destination =
        address;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    profileLoading
  ) {
    return (
      <div className="rider-loading">
        <Loader2
          size={26}
          className="rider-spin"
        />

        <strong>
          Loading rider operations...
        </strong>

        <span>
          Syncing your assignments
        </span>
      </div>
    );
  }

  const riderName =
    rider?.name ||
    currentUser?.displayName ||
    currentUser?.email ||
    "Rider";

  const riderOnline =
    rider?.isOnline === true;

  return (
    <div className="rider-panel">
      {/* =================================================
          HERO
      ================================================= */}

      <section className="rider-hero">
        <div className="rider-hero__content">
          <div className="rider-eyebrow">
            <span className="rider-live-dot" />

            RIDER OPERATIONS
          </div>

          <h1>
            Hello,{" "}
            <span>
              {riderName}
            </span>
          </h1>

          <p>
            Manage your assigned pickups
            and deliveries from one secure
            workspace.
          </p>
        </div>

        <div className="rider-hero__actions">
          <button
            type="button"
            className={
              riderOnline
                ? "rider-online-button is-online"
                : "rider-online-button"
            }
            onClick={
              toggleAvailability
            }
          >
            <span />

            {riderOnline
              ? "You're Online"
              : "Go Online"}
          </button>

          <button
            type="button"
            className="rider-location-button"
            onClick={
              updateCurrentLocation
            }
            disabled={
              locationLoading
            }
          >
            {locationLoading ? (
              <Loader2
                size={17}
                className="rider-spin"
              />
            ) : (
              <Navigation size={17} />
            )}

            Update GPS
          </button>
        </div>
      </section>

      {/* =================================================
          PROFILE / STATUS
      ================================================= */}

      <section className="rider-status-grid">
        <div className="rider-status-card">
          <div className="rider-status-card__icon">
            <CircleUserRound
              size={20}
            />
          </div>

          <div>
            <span>
              Rider
            </span>

            <strong>
              {riderName}
            </strong>
          </div>
        </div>

        <div className="rider-status-card">
          <div className="rider-status-card__icon">
            <Bike size={20} />
          </div>

          <div>
            <span>
              Vehicle
            </span>

            <strong>
              {rider?.vehicleNumber ||
                rider?.vehicleType ||
                "Not added"}
            </strong>
          </div>
        </div>

        <div className="rider-status-card">
          <div className="rider-status-card__icon">
            <Route size={20} />
          </div>

          <div>
            <span>
              Active Tasks
            </span>

            <strong>
              {counts.active}
            </strong>
          </div>
        </div>

        <div className="rider-status-card">
          <div className="rider-status-card__icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Completed
            </span>

            <strong>
              {counts.completed}
            </strong>
          </div>
        </div>
      </section>

      {error && (
        <div className="rider-error">
          <ShieldCheck size={17} />

          <span>
            {error}
          </span>
        </div>
      )}

      {/* =================================================
          TABS
      ================================================= */}

      <section className="rider-workspace">
        <div className="rider-workspace__header">
          <div>
            <span>
              MY WORK
            </span>

            <h2>
              Pickup & Delivery
            </h2>
          </div>

          <button
            type="button"
            className="rider-refresh"
            onClick={() =>
              window.location.reload()
            }
          >
            <RefreshCcw size={15} />
            Refresh
          </button>
        </div>

        <div className="rider-tabs">
          <button
            type="button"
            className={
              activeTab === "new"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("new")
            }
          >
            New

            <span>
              {counts.new}
            </span>
          </button>

          <button
            type="button"
            className={
              activeTab === "active"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("active")
            }
          >
            Active

            <span>
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            className={
              activeTab === "completed"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("completed")
            }
          >
            Completed

            <span>
              {counts.completed}
            </span>
          </button>
        </div>

        {/* ===============================================
            TASK LIST
        =============================================== */}

        <div className="rider-task-list">
          {visibleTasks.length === 0 ? (
            <div className="rider-empty">
              <div className="rider-empty__icon">
                <Bike size={28} />
              </div>

              <h3>
                {activeTab === "new"
                  ? "No new assignments"
                  : activeTab ===
                      "active"
                    ? "No active journey"
                    : "No completed tasks yet"}
              </h3>

              <p>
                {activeTab === "new"
                  ? "New pickup or delivery assignments will appear here automatically."
                  : activeTab ===
                      "active"
                    ? "Accepted rider journeys will appear here."
                    : "Completed pickup and delivery jobs will be stored here."}
              </p>
            </div>
          ) : (
            visibleTasks.map(
              (task) => {
                const status =
                  String(
                    task.status || ""
                  )
                    .trim()
                    .toLowerCase();

                const delivery =
                  isDeliveryTask(task);

                const nextAction =
                  getNextAction(task);

                const ActionIcon =
                  nextAction?.icon ||
                  ChevronRight;

                const customerName =
                  getCustomerName(task);

                const phone =
                  getCustomerPhone(task);

                const device =
                  getDeviceName(task);

                const address =
                  getAddress(task);

                const updating =
                  updatingId ===
                  task.id;

                return (
                  <article
                    className="rider-task"
                    key={task.id}
                  >
                    <div className="rider-task__top">
                      <div className="rider-task__type">
                        <div
                          className={
                            delivery
                              ? "rider-task__type-icon delivery"
                              : "rider-task__type-icon"
                          }
                        >
                          {delivery ? (
                            <Truck
                              size={19}
                            />
                          ) : (
                            <Box
                              size={19}
                            />
                          )}
                        </div>

                        <div>
                          <span>
                            {delivery
                              ? "DELIVERY"
                              : "PICKUP"}
                          </span>

                          <strong>
                            {task.pickupId ||
                              task.requestId ||
                              task.id}
                          </strong>
                        </div>
                      </div>

                      <div className="rider-task__status">
                        <span />

                        {getStatusLabel(
                          status
                        )}
                      </div>
                    </div>

                    <div className="rider-task__device">
                      <div className="rider-task__device-icon">
                        <Smartphone
                          size={23}
                        />
                      </div>

                      <div>
                        <span>
                          DEVICE
                        </span>

                        <h3>
                          {device}
                        </h3>

                        {task.problem && (
                          <p>
                            {task.problem}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rider-task__details">
                      <div className="rider-detail">
                        <CircleUserRound
                          size={17}
                        />

                        <div>
                          <span>
                            Customer
                          </span>

                          <strong>
                            {customerName}
                          </strong>
                        </div>
                      </div>

                      <div className="rider-detail">
                        <Phone
                          size={17}
                        />

                        <div>
                          <span>
                            Phone
                          </span>

                          <strong>
                            {phone
                              ? `+91 ${phone}`
                              : "Unavailable"}
                          </strong>
                        </div>
                      </div>

                      <div className="rider-detail rider-detail--wide">
                        <MapPin
                          size={17}
                        />

                        <div>
                          <span>
                            {delivery
                              ? "Delivery Address"
                              : "Pickup Address"}
                          </span>

                          <strong>
                            {address}
                          </strong>
                        </div>
                      </div>

                      {(task.pickupDate ||
                        task.pickupTime) && (
                        <div className="rider-detail rider-detail--wide">
                          <Clock3
                            size={17}
                          />

                          <div>
                            <span>
                              Preferred Time
                            </span>

                            <strong>
                              {[
                                task.pickupDate,
                                task.pickupTime,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rider-task__quick-actions">
                      <button
                        type="button"
                        onClick={() =>
                          callCustomer(
                            task
                          )
                        }
                      >
                        <Phone
                          size={16}
                        />

                        Call
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openNavigation(
                            task
                          )
                        }
                      >
                        <Navigation
                          size={16}
                        />

                        Navigate

                        <ExternalLink
                          size={12}
                        />
                      </button>
                    </div>

                    {nextAction && (
                      <button
                        type="button"
                        className="rider-primary-action"
                        disabled={
                          updating
                        }
                        onClick={() =>
                          updateTaskStatus(
                            task,
                            nextAction.nextStatus
                          )
                        }
                      >
                        {updating ? (
                          <Loader2
                            size={18}
                            className="rider-spin"
                          />
                        ) : (
                          <ActionIcon
                            size={18}
                          />
                        )}

                        {updating
                          ? "Updating..."
                          : nextAction.label}

                        {!updating && (
                          <ChevronRight
                            size={18}
                          />
                        )}
                      </button>
                    )}

                    {COMPLETED_STATUSES.includes(
                      status
                    ) && (
                      <div className="rider-completed-message">
                        <CheckCircle2
                          size={17}
                        />

                        <span>
                          {status ===
                          TASK_STATUS.DELIVERED
                            ? "Delivery completed successfully"
                            : "Pickup handed over successfully"}
                        </span>
                      </div>
                    )}
                  </article>
                );
              }
            )
          )}
        </div>
      </section>
    </div>
  );
};

export default RiderPanel;