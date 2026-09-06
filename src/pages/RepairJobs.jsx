import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../repairJobs.css";

import NewRepairJobModal from "../components/NewRepairJobModal";
import JobDetailsModal from "../components/JobDetailsModal";

import {
  Search,
  Plus,
  Filter,
  Smartphone,
  User,
  Phone,
  Wrench,
  Clock3,
  IndianRupee,
  Eye,
  ChevronDown,
  RotateCcw,
  PauseCircle,
  AlertCircle,
  PackageCheck,
  TestTube2,
  ArrowRightLeft,
  ShieldCheck,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebase";

/* =========================================================
   SETTINGS
========================================================= */

const SETTINGS_STORAGE_KEY =
  "ansar_telecom_settings";

const getSavedSettings = () => {
  try {
    const saved =
      localStorage.getItem(
        SETTINGS_STORAGE_KEY
      );

    if (!saved) {
      return {
        jobPrefix: "AT",
        autoJobNumber: true,
      };
    }

    const parsed =
      JSON.parse(saved);

    return {
      jobPrefix:
        String(
          parsed.jobPrefix ||
            "AT"
        )
          .trim()
          .toUpperCase() ||
        "AT",

      autoJobNumber:
        parsed.autoJobNumber !==
        false,
    };
  } catch (error) {
    console.error(
      "Unable to load repair settings:",
      error
    );

    return {
      jobPrefix: "AT",
      autoJobNumber: true,
    };
  }
};

/* =========================================================
   V2 REPAIR STAGES

   IMPORTANT:
   Legacy status is intentionally preserved.

   Legacy status:
   Pending
   In Progress
   Paused
   Ready
   Completed
   Returned

   V2 repairStage gives us the actual
   business/customer lifecycle.
========================================================= */

const REPAIR_STAGES = {
  RECEIVED: "Device Received",
  DIAGNOSIS: "Diagnosis",

  WAITING_APPROVAL:
    "Waiting Customer Approval",

  APPROVED: "Approved",

  REPAIR:
    "Repair In Progress",

  WAITING_PART:
    "Waiting Part",

  TESTING:
    "Testing",

  READY:
    "Ready",

  DELIVERED:
    "Delivered",

  RETURNED:
    "Returned to Reception",

  RETURN_WITHOUT_REPAIR:
    "Returned Without Repair",
};

/* =========================================================
   BASIC HELPERS
========================================================= */

const normalizeText = (
  value
) =>
  String(
    value || ""
  )
    .trim()
    .toLowerCase();

const toNumber = (
  value
) => {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
};

/* =========================================================
   REPAIR STAGE FALLBACK

   Old jobs may not have repairStage.
   This makes them compatible automatically.
========================================================= */

const getRepairStage = (
  job
) => {
  if (
    job?.repairStage
  ) {
    return job.repairStage;
  }

  switch (
    job?.status
  ) {
    case "Pending":
      return REPAIR_STAGES.RECEIVED;

    case "In Progress":
      return REPAIR_STAGES.REPAIR;

    case "Paused":
      return "Paused";

    case "Ready":
      return REPAIR_STAGES.READY;

    case "Completed":
      return REPAIR_STAGES.DELIVERED;

    case "Returned":
      return REPAIR_STAGES.RETURNED;

    default:
      return REPAIR_STAGES.RECEIVED;
  }
};

/* =========================================================
   STAGE CLASS
========================================================= */

const getStageClass = (
  stage,
  status
) => {
  if (
    stage ===
      REPAIR_STAGES.DELIVERED ||
    status ===
      "Completed"
  ) {
    return "job-status completed";
  }

  if (
    stage ===
      REPAIR_STAGES.READY ||
    status ===
      "Ready"
  ) {
    return "job-status ready";
  }

  if (
    stage ===
      REPAIR_STAGES.REPAIR ||
    stage ===
      REPAIR_STAGES.TESTING ||
    stage ===
      REPAIR_STAGES.DIAGNOSIS ||
    stage ===
      REPAIR_STAGES.APPROVED ||
    status ===
      "In Progress"
  ) {
    return "job-status progress";
  }

  if (
    stage ===
      REPAIR_STAGES.WAITING_APPROVAL ||
    stage ===
      REPAIR_STAGES.WAITING_PART ||
    status ===
      "Paused"
  ) {
    return "job-status paused";
  }

  if (
    stage ===
      REPAIR_STAGES.RETURNED ||
    stage ===
      REPAIR_STAGES.RETURN_WITHOUT_REPAIR ||
    status ===
      "Returned"
  ) {
    return "job-status returned";
  }

  return "job-status pending";
};

/* =========================================================
   PAYMENT CLASS
========================================================= */

const getPaymentClass = (
  payment
) => {
  if (
    payment === "Paid"
  ) {
    return "payment-badge paid";
  }

  if (
    payment ===
      "Advance Paid" ||
    payment ===
      "Partial"
  ) {
    return "payment-badge advance";
  }

  return "payment-badge unpaid";
};

/* =========================================================
   COMPONENT
========================================================= */

const RepairJobs = () => {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    isNewJobOpen,
    setIsNewJobOpen,
  ] = useState(false);

  const [
    jobs,
    setJobs,
  ] = useState([]);

  const [
    technicians,
    setTechnicians,
  ] = useState([]);

  const [
    loadingJobs,
    setLoadingJobs,
  ] = useState(true);

  const [
    _loadingTechnicians,
    setLoadingTechnicians,
  ] = useState(true);

  const [
    jobActionError,
    setJobActionError,
  ] = useState("");

  const [
    settings,
    setSettings,
  ] = useState(
    getSavedSettings
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    selectedJobId,
    setSelectedJobId,
  ] = useState(null);

  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(false);

  /* =======================================================
     LIVE REPAIR JOBS
  ======================================================= */

  useEffect(() => {
    const jobsCollection =
      collection(
        db,
        "repairJobs"
      );

    const unsubscribe =
      onSnapshot(
        jobsCollection,

        (snapshot) => {
          const liveJobs =
            snapshot.docs
              .map(
                (
                  docSnapshot
                ) => ({
                  ...docSnapshot.data(),

                  id:
                    docSnapshot.id,
                })
              )
              .sort(
                (
                  a,
                  b
                ) => {
                  const aTime =
                    a.createdAt
                      ?.toMillis?.() ||
                    0;

                  const bTime =
                    b.createdAt
                      ?.toMillis?.() ||
                    0;

                  return (
                    bTime -
                    aTime
                  );
                }
              );

          setJobs(
            liveJobs
          );

          setLoadingJobs(
            false
          );
        },

        (error) => {
          console.error(
            "Unable to load repair jobs:",
            error
          );

          setLoadingJobs(
            false
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  /* =======================================================
     LIVE TECHNICIANS
  ======================================================= */

  useEffect(() => {
    const usersCollection =
      collection(
        db,
        "users"
      );

    const unsubscribe =
      onSnapshot(
        usersCollection,

        (snapshot) => {
          const liveTechnicians =
            [];

          snapshot.forEach(
            (
              docSnapshot
            ) => {
              const data =
                docSnapshot.data();

              const role =
                String(
                  data.role ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              if (
                role ===
                "technician"
              ) {
                liveTechnicians.push({
                  id:
                    docSnapshot.id,

                  uid:
                    docSnapshot.id,

                  ...data,
                });
              }
            }
          );

          liveTechnicians.sort(
            (
              a,
              b
            ) =>
              String(
                a.name ||
                  a.fullName ||
                  ""
              ).localeCompare(
                String(
                  b.name ||
                    b.fullName ||
                    ""
                )
              )
          );

          setTechnicians(
            liveTechnicians
          );

          setLoadingTechnicians(
            false
          );
        },

        (error) => {
          console.error(
            "Unable to load technicians:",
            error
          );

          setLoadingTechnicians(
            false
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  /* =======================================================
     SELECTED JOB

     Store ID rather than stale object.
  ======================================================= */

  const selectedJob =
    useMemo(() => {
      if (
        !selectedJobId
      ) {
        return null;
      }

      return (
        jobs.find(
          (
            job
          ) =>
            String(
              job.id
            ) ===
            String(
              selectedJobId
            )
        ) || null
      );
    }, [
      jobs,
      selectedJobId,
    ]);

  /* =======================================================
     OPEN JOB FROM DASHBOARD
  ======================================================= */

  useEffect(() => {
    const openJobId =
      location.state
        ?.openJobId;

    if (
      !openJobId ||
      jobs.length === 0
    ) {
      return;
    }

    const targetJob =
      jobs.find(
        (
          job
        ) =>
          String(
            job.id
          ) ===
          String(
            openJobId
          )
      );

    if (!targetJob) {
      return;
    }

    setSelectedJobId(
      targetJob.id
    );

    setIsDetailsOpen(
      true
    );

    setSearchQuery(
      ""
    );

    setStatusFilter(
      "All"
    );

    navigate(
      location.pathname,
      {
        replace: true,
        state: null,
      }
    );
  }, [
    location.state,
    location.pathname,
    jobs,
    navigate,
  ]);

  /* =======================================================
     FIELD HELPERS
  ======================================================= */

  const getCustomer =
    (job) =>
      job.customer ||
      job.customerName ||
      "Unknown Customer";

  const getPhone =
    (job) =>
      job.phone ||
      job.mobileNumber ||
      job.customerPhone ||
      "No number";

  const getDevice =
    (job) => {
      if (
        job.device
      ) {
        return job.device;
      }

      if (
        job.deviceModel
      ) {
        return job.deviceModel;
      }

      const combined =
        `${job.brand || ""} ${
          job.model || ""
        }`.trim();

      return (
        combined ||
        "Device"
      );
    };

  const getIssue =
    (job) =>
      job.issue ||
      job.reportedProblem ||
      job.problem ||
      "Issue not specified";

  const getTechnician =
    (job) =>
      job.technician ||
      job.technicianName ||
      job.assignedTo ||
      job.assignedTechnician ||
      "Unassigned";

  const getAmount =
    (job) =>
      toNumber(
        job.estimate
          ?.totalAmount ??
          job.amount ??
          job.estimatedCharge ??
          job.totalAmount ??
          0
      );

  const getAdvance =
    (job) =>
      toNumber(
        job.receivedAmount ??
          job.paidAmount ??
          job.advance ??
          job.advanceReceived ??
          0
      );

  const getBalance = useCallback(
    (job) =>
      Math.max(
        getAmount(job) -
          getAdvance(job),
        0
      ),
    []
  );

  const getPayment =
    (job) => {
      if (
        job.paymentStatus
      ) {
        if (
          job.paymentStatus ===
          "Partial"
        ) {
          return "Advance Paid";
        }

        return job.paymentStatus;
      }

      if (
        job.payment
      ) {
        return job.payment;
      }

      const amount =
        getAmount(
          job
        );

      const advance =
        getAdvance(
          job
        );

      if (
        amount > 0 &&
        advance >= amount
      ) {
        return "Paid";
      }

      if (
        advance > 0
      ) {
        return "Advance Paid";
      }

      return "Pending";
    };

  const getReceived =
    (job) => {
      if (
        job.received
      ) {
        return job.received;
      }

      const timestamp =
        job.createdAt;

      if (!timestamp) {
        return "—";
      }

      try {
        const date =
          typeof timestamp.toDate ===
          "function"
            ? timestamp.toDate()
            : new Date(
                timestamp
              );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return "—";
        }

        return date.toLocaleDateString(
          "en-IN",
          {
            day:
              "2-digit",

            month:
              "short",

            year:
              "numeric",
          }
        );
      } catch {
        return "—";
      }
    };

  const getTechName =
    (technician) =>
      technician.name ||
      technician.fullName ||
      technician.technicianName ||
      "Technician";

  /* =======================================================
     SETTINGS
  ======================================================= */

  const refreshSettings =
    () => {
      setSettings(
        getSavedSettings()
      );
    };

  const handleOpenNewJob =
    () => {
      refreshSettings();

      setJobActionError(
        ""
      );

      setIsNewJobOpen(
        true
      );
    };

  /* =======================================================
     TECHNICIAN JOB MATCH
  ======================================================= */

  const isJobAssignedToTechnician = useCallback(
    (
      job,
      technician
    ) => {
      const techId =
        String(
          technician.id ||
            technician.uid ||
            ""
        );

      const possibleIds =
        [
          job.technicianId,
          job.technicianUid,
          job.assignedTechnicianId,
          job.assignedToId,
          job.userId,
        ]
          .filter(
            Boolean
          )
          .map(
            String
          );

      if (
        techId &&
        possibleIds.includes(
          techId
        )
      ) {
        return true;
      }

      const techName =
        getTechName(
          technician
        )
          .trim()
          .toLowerCase();

      const jobNames =
        [
          job.technician,
          job.technicianName,
          job.assignedTo,
          job.assignedTechnician,
        ]
          .filter(
            Boolean
          )
          .map(
            (
              value
            ) =>
              String(
                value
              )
                .trim()
                .toLowerCase()
          );

      return (
        techName &&
        jobNames.includes(
          techName
        )
      );
    },
    []
  );

  /* =======================================================
     TECHNICIAN QUEUE
  ======================================================= */

  const getTechnicianQueue = useCallback(
    (technician) => {
      return jobs.filter(
        (job) =>
          isJobAssignedToTechnician(
            job,
            technician
          ) &&
          [
            "Pending",
            "In Progress",
            "Paused",
            "Returned",
          ].includes(
            job.status
          )
      );
    },
    [jobs, isJobAssignedToTechnician]
  );

  /* =======================================================
     ASSIGNABLE TECHNICIANS
  ======================================================= */

  const availableTechnicians =
    useMemo(() => {
      return technicians
        .filter(
          (
            technician
          ) => {
            const staffStatus =
              String(
                technician.status ||
                  "Active"
              )
                .trim()
                .toLowerCase();

            const availability =
              String(
                technician.availabilityStatus ||
                  ""
              )
                .trim()
                .toLowerCase();

            if (
              staffStatus ===
                "inactive" ||
              staffStatus ===
                "on leave"
            ) {
              return false;
            }

            if (
              availability ===
              "leave"
            ) {
              return false;
            }

            return true;
          }
        )
        .map(
          (
            technician
          ) => {
            const queue =
              getTechnicianQueue(
                technician
              );

            const inProgressCount =
              queue.filter(
                (
                  job
                ) =>
                  job.status ===
                  "In Progress"
              ).length;

            const pendingCount =
              queue.filter(
                (
                  job
                ) =>
                  job.status ===
                    "Pending" ||
                  job.status ===
                    "Returned"
              ).length;

            const pausedCount =
              queue.filter(
                (
                  job
                ) =>
                  job.status ===
                  "Paused"
              ).length;

            return {
              ...technician,

              name:
                getTechName(
                  technician
                ),

              pendingCount,

              inProgressCount,

              pausedCount,

              totalQueue:
                queue.length,

              liveStatus:
                queue.length >
                0
                  ? "Busy"
                  : "Available",
            };
          }
        );
    }, [
      technicians,
      getTechnicianQueue,
    ]);

  /* =======================================================
     CREATE JOB

     NewRepairJobModal already sends V2 fields.
     We preserve them and fill safe defaults
     for older modal payloads too.
  ======================================================= */

  const handleCreateJob =
    async (
      jobData
    ) => {
      setJobActionError(
        ""
      );

      const prefix =
        String(
          settings.jobPrefix ||
            "AT"
        )
          .trim()
          .toUpperCase() ||
        "AT";

      try {
        const selectedUid =
          jobData.technicianId ||
          jobData.technicianUid ||
          jobData.assignedTechnicianId ||
          jobData.assignedToId ||
          "";

        const selectedName =
          jobData.technician ||
          jobData.technicianName ||
          jobData.assignedTo ||
          "";

        const selectedTechnician =
          technicians.find(
            (
              technician
            ) => {
              const idMatch =
                selectedUid &&
                String(
                  technician.id
                ) ===
                  String(
                    selectedUid
                  );

              const nameMatch =
                selectedName &&
                getTechName(
                  technician
                )
                  .trim()
                  .toLowerCase() ===
                  String(
                    selectedName
                  )
                    .trim()
                    .toLowerCase();

              return (
                idMatch ||
                nameMatch
              );
            }
          );

        const assignedUid =
          selectedTechnician
            ?.id ||
          selectedUid ||
          "";

        const assignedName =
          selectedTechnician
            ? getTechName(
                selectedTechnician
              )
            : selectedName ||
              "";

        const counterReference =
          doc(
            db,
            "counters",
            "repairJobs"
          );

        const nextJobId =
          await runTransaction(
            db,

            async (
              transaction
            ) => {
              const counterSnapshot =
                await transaction.get(
                  counterReference
                );

              const currentNumber =
                counterSnapshot.exists()
                  ? Number(
                      counterSnapshot.data()
                        .lastNumber
                    ) ||
                    1048
                  : 1048;

              const nextNumber =
                currentNumber +
                1;

              transaction.set(
                counterReference,

                {
                  lastNumber:
                    nextNumber,
                },

                {
                  merge: true,
                }
              );

              return `${prefix}-${nextNumber}`;
            }
          );

        const jobReference =
          doc(
            db,
            "repairJobs",
            nextJobId
          );

        const amount =
          toNumber(
            jobData.estimate
              ?.totalAmount ??
              jobData.amount ??
              jobData.estimatedCharge ??
              0
          );

        const advance =
          toNumber(
            jobData.receivedAmount ??
              jobData.advance ??
              jobData.advanceReceived ??
              0
          );

        let payment =
          "Pending";

        if (
          amount > 0 &&
          advance >= amount
        ) {
          payment =
            "Paid";
        } else if (
          advance > 0
        ) {
          payment =
            "Advance Paid";
        }

        const nowIso =
          new Date().toISOString();

        const initialStage =
          jobData.repairStage ||
          REPAIR_STAGES.RECEIVED;

        const initialCustomerStatus =
          jobData.customerStatus ||
          "Your device has been received at Ansar Telecom.";

        const initialCustomerStatusCode =
          jobData.customerStatusCode ||
          "DEVICE_RECEIVED";

        await setDoc(
          jobReference,
          {
            ...jobData,

            id:
              nextJobId,

            customer:
              jobData.customer ||
              jobData.customerName ||
              "",

            customerName:
              jobData.customerName ||
              jobData.customer ||
              "",

            phone:
              jobData.phone ||
              jobData.mobileNumber ||
              jobData.customerPhone ||
              "",

            mobileNumber:
              jobData.mobileNumber ||
              jobData.phone ||
              jobData.customerPhone ||
              "",

            device:
              jobData.device ||
              jobData.deviceModel ||
              `${jobData.brand || ""} ${
                jobData.model || ""
              }`.trim(),

            issue:
              jobData.issue ||
              jobData.problem ||
              jobData.reportedProblem ||
              "",

            reportedProblem:
              jobData.reportedProblem ||
              jobData.problem ||
              jobData.issue ||
              "",

            technician:
              assignedName,

            technicianName:
              assignedName,

            technicianId:
              assignedUid,

            technicianUid:
              assignedUid,

            assignedTechnicianId:
              assignedUid,

            assignedToId:
              assignedUid,

            assignedTo:
              assignedName,

            assignedTechnician:
              assignedName,

            amount,

            estimatedCharge:
              amount,

            advance,

            advanceReceived:
              advance,

            receivedAmount:
              advance,

            paidAmount:
              advance,

            balanceAmount:
              Math.max(
                amount -
                  advance,
                0
              ),

            payment,

            paymentStatus:
              payment ===
              "Advance Paid"
                ? "Partial"
                : payment,

            /*
             * Keep legacy status.
             * Technician + Reception still use it.
             */
            status:
              jobData.status ||
              jobData.initialStatus ||
              "Pending",

            /*
             * V2 lifecycle.
             */
            repairStage:
              initialStage,

            customerStatus:
              initialCustomerStatus,

            customerStatusCode:
              initialCustomerStatusCode,

            diagnosis:
              jobData.diagnosis || {
                status:
                  "Not Started",

                summary:
                  "",

                technicianNotes:
                  "",

                diagnosedBy:
                  "",

                diagnosedByUid:
                  "",

                startedAt:
                  null,

                completedAt:
                  null,
              },

            estimate:
              jobData.estimate || {
                status:
                  amount > 0
                    ? "Initial Estimate"
                    : "Not Prepared",

                partsAmount:
                  0,

                labourAmount:
                  0,

                totalAmount:
                  amount,

                notes:
                  "",

                preparedBy:
                  "",

                preparedByUid:
                  "",

                preparedAt:
                  null,
              },

            customerApproval:
              jobData.customerApproval || {
                status:
                  "Not Required Yet",

                requestedAt:
                  null,

                respondedAt:
                  null,

                approvedAt:
                  null,

                rejectedAt:
                  null,

                source:
                  "",

                notes:
                  "",
              },

            partRequirement:
              jobData.partRequirement || {
                status:
                  "Not Required",

                partName:
                  "",

                notes:
                  "",

                requestedAt:
                  null,

                receivedAt:
                  null,
              },

            testing:
              jobData.testing || {
                status:
                  "Not Started",

                notes:
                  "",

                startedAt:
                  null,

                completedAt:
                  null,
              },

            delivery:
              jobData.delivery || {
                status:
                  "At Shop",

                method:
                  "",

                readyAt:
                  null,

                deliveredAt:
                  null,

                deliveredBy:
                  "",

                notes:
                  "",
              },

            customerTrackingEnabled:
              jobData.customerTrackingEnabled !==
              false,

            trackingVisibility:
              jobData.trackingVisibility || {
                showRepairStage:
                  true,

                showEstimate:
                  true,

                showTechnician:
                  false,

                showInternalNotes:
                  false,

                showPayment:
                  true,
              },

            stageHistory:
              Array.isArray(
                jobData.stageHistory
              ) &&
              jobData.stageHistory.length >
                0
                ? jobData.stageHistory
                : [
                    {
                      stage:
                        initialStage,

                      customerStatus:
                        initialCustomerStatus,

                      source:
                        "Owner",

                      createdAt:
                        nowIso,
                    },
                  ],

            pickupRequestId:
              jobData.pickupRequestId ||
              "",

            deliveryRequestId:
              jobData.deliveryRequestId ||
              "",

            serviceMode:
              jobData.serviceMode ||
              "Walk In",

            whatsapp:
              jobData.whatsapp || {
                notificationsEnabled:
                  true,

                lastNotificationType:
                  "",

                lastNotificationAt:
                  null,
              },

            transferRequest:
              jobData.transferRequest || {
                status: "",
              },

            assignedAt:
              assignedUid
                ? serverTimestamp()
                : null,

            startedAt:
              null,

            pausedAt:
              null,

            pauseReason:
              "",

            completedAt:
              null,

            totalPausedSeconds:
              0,

            totalTimeSeconds:
              0,

            isReturned:
              false,

            returnCount:
              0,

            transferHistory:
              Array.isArray(
                jobData.transferHistory
              )
                ? jobData.transferHistory
                : [],

            returnHistory:
              Array.isArray(
                jobData.returnHistory
              )
                ? jobData.returnHistory
                : [],

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        return nextJobId;
      } catch (
        error
      ) {
        console.error(
          "Unable to create repair job:",
          error
        );

        setJobActionError(
          "Unable to create the repair job. Please try again."
        );

        throw error;
      }
    };

  /* =======================================================
     VIEW JOB
  ======================================================= */

  const handleViewJob =
    (
      job
    ) => {
      setJobActionError(
        ""
      );

      setSelectedJobId(
        job.id
      );

      setIsDetailsOpen(
        true
      );
    };

  const handleCloseDetails =
    () => {
      setIsDetailsOpen(
        false
      );

      setSelectedJobId(
        null
      );

      setJobActionError(
        ""
      );
    };

  /* =======================================================
     UPDATE JOB

     IMPORTANT:
     Do not automatically rewrite repairStage
     from status here.

     Technician / Reception already update
     repairStage intentionally.
  ======================================================= */

  const handleUpdateJob =
    async (
      updatedJob
    ) => {
      setJobActionError(
        ""
      );

      if (
        !updatedJob?.id
      ) {
        throw new Error(
          "Job ID missing."
        );
      }

      try {
        const jobReference =
          doc(
            db,
            "repairJobs",
            updatedJob.id
          );

        const {
          id: _id,
          createdAt: _createdAt,
          ...safeUpdate
        } =
          updatedJob;

        /*
         * Backward compatibility for old
         * JobDetailsModal status updates.
         *
         * Only fill repairStage when
         * modal did not provide one.
         */

        if (
          !safeUpdate.repairStage
        ) {
          if (
            safeUpdate.status ===
            "Ready"
          ) {
            safeUpdate.repairStage =
              REPAIR_STAGES.READY;

            safeUpdate.customerStatus =
              safeUpdate.customerStatus ||
              "Your device is ready for collection.";

            safeUpdate.customerStatusCode =
              safeUpdate.customerStatusCode ||
              "READY";
          }

          if (
            safeUpdate.status ===
            "Completed"
          ) {
            safeUpdate.repairStage =
              REPAIR_STAGES.DELIVERED;

            safeUpdate.customerStatus =
              safeUpdate.customerStatus ||
              "Your device has been delivered successfully.";

            safeUpdate.customerStatusCode =
              safeUpdate.customerStatusCode ||
              "DELIVERED";
          }

          if (
            safeUpdate.status ===
            "Returned"
          ) {
            safeUpdate.repairStage =
              REPAIR_STAGES.RETURNED;

            safeUpdate.customerStatus =
              safeUpdate.customerStatus ||
              "Your device is currently at the reception desk.";

            safeUpdate.customerStatusCode =
              safeUpdate.customerStatusCode ||
              "RETURNED_TO_RECEPTION";
          }
        }

        await updateDoc(
          jobReference,
          {
            ...safeUpdate,

            updatedAt:
              serverTimestamp(),
          }
        );

        return true;
      } catch (
        error
      ) {
        console.error(
          "Unable to update repair job:",
          error
        );

        setJobActionError(
          "Unable to save changes. Please try again."
        );

        throw error;
      }
    };

  /* =======================================================
     STATS
  ======================================================= */

  const stats =
    useMemo(() => {
      const activeJobs =
        jobs.filter(
          (
            job
          ) =>
            ![
              "Completed",
            ].includes(
              job.status
            ) &&
            getRepairStage(job) !==
              REPAIR_STAGES.DELIVERED
        ).length;

      const inProgress =
        jobs.filter(
          (
            job
          ) =>
            job.status ===
              "In Progress" ||
            [
              REPAIR_STAGES.DIAGNOSIS,
              REPAIR_STAGES.APPROVED,
              REPAIR_STAGES.REPAIR,
              REPAIR_STAGES.TESTING,
            ].includes(
              getRepairStage(job)
            )
        ).length;

      const readyDelivery =
        jobs.filter(
          (
            job
          ) =>
            job.status ===
              "Ready" ||
            getRepairStage(job) ===
              REPAIR_STAGES.READY
        ).length;

      const paused =
        jobs.filter(
          (
            job
          ) =>
            job.status ===
              "Paused"
        ).length;

      const returned =
        jobs.filter(
          (
            job
          ) =>
            job.status ===
              "Returned" ||
            job.isReturned ===
              true ||
            [
              REPAIR_STAGES.RETURNED,
              REPAIR_STAGES.RETURN_WITHOUT_REPAIR,
            ].includes(
              getRepairStage(job)
            )
        ).length;

      const waitingApproval =
        jobs.filter(
          (
            job
          ) =>
            getRepairStage(job) ===
            REPAIR_STAGES.WAITING_APPROVAL
        ).length;

      const waitingPart =
        jobs.filter(
          (
            job
          ) =>
            getRepairStage(job) ===
            REPAIR_STAGES.WAITING_PART
        ).length;

      const testing =
        jobs.filter(
          (
            job
          ) =>
            getRepairStage(job) ===
            REPAIR_STAGES.TESTING
        ).length;

      const transferRequests =
        jobs.filter(
          (
            job
          ) =>
            normalizeText(
              job?.transferRequest
                ?.status
            ) ===
            "pending"
        ).length;

      const pendingPayment =
        jobs.reduce(
          (
            total,
            job
          ) =>
            total +
            getBalance(job),
          0
        );

      return {
        activeJobs,
        inProgress,
        readyDelivery,
        paused,
        returned,
        waitingApproval,
        waitingPart,
        testing,
        transferRequests,
        pendingPayment,
      };
    }, [
      jobs,
      getBalance,
    ]);

  /* =======================================================
     FILTER JOBS

     Filter understands BOTH:
     - legacy status
     - V2 repairStage
  ======================================================= */

  const filteredJobs =
    useMemo(() => {
      const search =
        searchQuery
          .trim()
          .toLowerCase();

      return jobs.filter(
        (
          job
        ) => {
          const stage =
            getRepairStage(
              job
            );

          const searchableValues =
            [
              job.id,

              getCustomer(
                job
              ),

              getPhone(
                job
              ),

              getDevice(
                job
              ),

              getIssue(
                job
              ),

              getTechnician(
                job
              ),

              stage,

              job.status,

              job.customerStatus,

              job.imei,

              job.returnReason,

              job.returnType,

              job?.partRequirement
                ?.partName,

              job?.transferRequest
                ?.reason,

              job?.transferRequest
                ?.targetTechnicianName,
            ];

          const matchesSearch =
            !search ||
            searchableValues.some(
              (
                value
              ) =>
                String(
                  value ||
                    ""
                )
                  .toLowerCase()
                  .includes(
                    search
                  )
            );

          let matchesStatus =
            true;

          if (
            statusFilter !==
            "All"
          ) {
            if (
              statusFilter ===
              "Transfer Requests"
            ) {
              matchesStatus =
                normalizeText(
                  job
                    ?.transferRequest
                    ?.status
                ) ===
                "pending";
            } else {
              matchesStatus =
                job.status ===
                  statusFilter ||
                stage ===
                  statusFilter;
            }
          }

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      jobs,
      searchQuery,
      statusFilter,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="repair-jobs-page">

      {/* ================= HEADER ================= */}

      <div className="repair-jobs-header">

        <div>
          <span className="repair-page-eyebrow">
            Repair Operations
          </span>

          <h1>
            Repair Jobs
          </h1>

          <p>
            Track every device
            from receiving and
            diagnosis to approval,
            repair, testing and
            final delivery.
          </p>
        </div>

        <button
          type="button"
          className="repair-new-job-btn"
          onClick={
            handleOpenNewJob
          }
        >
          <Plus
            size={18}
          />

          New Repair Job
        </button>

      </div>

      {/* ================= ERROR ================= */}

      {jobActionError && (
        <div
          style={{
            padding:
              "12px 16px",

            marginBottom:
              "16px",

            border:
              "1px solid #fde2e2",

            borderRadius:
              "10px",

            background:
              "#fff8f8",

            color:
              "#b42318",

            fontSize:
              "13px",

            fontWeight:
              600,
          }}
        >
          <AlertCircle
            size={15}
            style={{
              verticalAlign:
                "middle",
              marginRight:
                "7px",
            }}
          />

          {
            jobActionError
          }
        </div>
      )}

      {/* ================= MAIN STATS ================= */}

      <div className="repair-stats">

        <div className="repair-stat-card">

          <div className="repair-stat-icon blue">
            <Smartphone
              size={20}
            />
          </div>

          <div>
            <span>
              Total Active Jobs
            </span>

            <strong>
              {
                stats.activeJobs
              }
            </strong>
          </div>

        </div>

        <div className="repair-stat-card">

          <div className="repair-stat-icon orange">
            <Clock3
              size={20}
            />
          </div>

          <div>
            <span>
              In Progress
            </span>

            <strong>
              {
                stats.inProgress
              }
            </strong>
          </div>

        </div>

        <div className="repair-stat-card">

          <div className="repair-stat-icon green">
            <PackageCheck
              size={20}
            />
          </div>

          <div>
            <span>
              Ready Delivery
            </span>

            <strong>
              {
                stats.readyDelivery
              }
            </strong>
          </div>

        </div>

        <div className="repair-stat-card">

          <div className="repair-stat-icon purple">
            <IndianRupee
              size={20}
            />
          </div>

          <div>
            <span>
              Pending Payment
            </span>

            <strong>
              ₹
              {stats.pendingPayment.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* ================= V2 ACTION SUMMARY ================= */}

      {(
        stats.waitingApproval >
          0 ||
        stats.waitingPart >
          0 ||
        stats.testing >
          0 ||
        stats.transferRequests >
          0
      ) && (
        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(170px, 1fr))",

            gap:
              "10px",

            marginBottom:
              "16px",
          }}
        >

          {stats.waitingApproval >
            0 && (
            <div
              className="repair-special-item paused"
              style={{
                minHeight:
                  "64px",
              }}
            >
              <AlertCircle
                size={16}
              />

              <span>
                Waiting Approval
              </span>

              <strong>
                {
                  stats.waitingApproval
                }
              </strong>
            </div>
          )}

          {stats.waitingPart >
            0 && (
            <div
              className="repair-special-item paused"
              style={{
                minHeight:
                  "64px",
              }}
            >
              <Wrench
                size={16}
              />

              <span>
                Waiting Part
              </span>

              <strong>
                {
                  stats.waitingPart
                }
              </strong>
            </div>
          )}

          {stats.testing >
            0 && (
            <div
              className="repair-special-item"
              style={{
                minHeight:
                  "64px",
              }}
            >
              <TestTube2
                size={16}
              />

              <span>
                Testing
              </span>

              <strong>
                {
                  stats.testing
                }
              </strong>
            </div>
          )}

          {stats.transferRequests >
            0 && (
            <div
              className="repair-special-item"
              style={{
                minHeight:
                  "64px",
              }}
            >
              <ArrowRightLeft
                size={16}
              />

              <span>
                Transfer Requests
              </span>

              <strong>
                {
                  stats.transferRequests
                }
              </strong>
            </div>
          )}

        </div>
      )}

      {/* ================= SECONDARY INFO ================= */}

      {(stats.returned >
        0 ||
        stats.paused >
          0) && (
        <div className="repair-special-summary">

          <div className="repair-special-item returned">
            <RotateCcw
              size={16}
            />

            <span>
              Returned
            </span>

            <strong>
              {
                stats.returned
              }
            </strong>
          </div>

          <div className="repair-special-item paused">
            <PauseCircle
              size={16}
            />

            <span>
              Paused
            </span>

            <strong>
              {
                stats.paused
              }
            </strong>
          </div>

        </div>
      )}

      {/* ================= JOB LIST ================= */}

      <section className="repair-jobs-card">

        <div className="repair-toolbar">

          <div className="repair-search">

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
              placeholder="Search Job ID, customer, phone, device, technician, stage or part..."
            />

          </div>

          <div className="repair-toolbar-actions">

            <button
              type="button"
              className="repair-filter-btn"
            >
              <Filter
                size={17}
              />

              Filters
            </button>

            <div className="repair-status-select-wrap">

              <select
                className="repair-status-select"
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="All">
                  All Status
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Device Received">
                  Device Received
                </option>

                <option value="Diagnosis">
                  Diagnosis
                </option>

                <option value="Waiting Customer Approval">
                  Waiting Approval
                </option>

                <option value="Approved">
                  Approved
                </option>

                <option value="In Progress">
                  In Progress
                </option>

                <option value="Repair In Progress">
                  Repair In Progress
                </option>

                <option value="Waiting Part">
                  Waiting Part
                </option>

                <option value="Testing">
                  Testing
                </option>

                <option value="Paused">
                  Paused
                </option>

                <option value="Ready">
                  Ready
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Delivered">
                  Delivered
                </option>

                <option value="Returned">
                  Returned
                </option>

                <option value="Returned Without Repair">
                  Returned Without Repair
                </option>

                <option value="Transfer Requests">
                  Transfer Requests
                </option>
              </select>

              <ChevronDown
                size={16}
              />

            </div>

          </div>

        </div>

        {/* ================= LOADING ================= */}

        {loadingJobs ? (
          <div className="repair-empty-state">
            <Clock3
              size={24}
            />

            <strong>
              Loading repair
              jobs...
            </strong>
          </div>
        ) : (
          <>

            {/* ================= DESKTOP ================= */}

            <div className="repair-table-wrap">

              <table className="repair-table">

                <thead>
                  <tr>
                    <th>
                      Job ID
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Device / Issue
                    </th>

                    <th>
                      Technician
                    </th>

                    <th>
                      Repair Stage
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Received
                    </th>

                    <th></th>
                  </tr>
                </thead>

                <tbody>

                  {filteredJobs.map(
                    (
                      job
                    ) => {
                      const customer =
                        getCustomer(
                          job
                        );

                      const phone =
                        getPhone(
                          job
                        );

                      const device =
                        getDevice(
                          job
                        );

                      const issue =
                        getIssue(
                          job
                        );

                      const technician =
                        getTechnician(
                          job
                        );

                      const payment =
                        getPayment(
                          job
                        );

                      const stage =
                        getRepairStage(
                          job
                        );

                      const transferPending =
                        normalizeText(
                          job
                            ?.transferRequest
                            ?.status
                        ) ===
                        "pending";

                      return (
                        <tr
                          key={
                            job.id
                          }
                          className={
                            job.status ===
                              "Returned"
                              ? "repair-returned-row"
                              : ""
                          }
                        >

                          {/* JOB ID */}

                          <td>
                            <div className="repair-job-id-wrap">

                              <strong className="repair-job-id">
                                {
                                  job.id
                                }
                              </strong>

                              {job.returnCount >
                                0 && (
                                <span className="repair-return-mini">
                                  <RotateCcw
                                    size={
                                      10
                                    }
                                  />

                                  {
                                    job.returnCount
                                  }
                                  x
                                </span>
                              )}

                              {transferPending && (
                                <span
                                  className="repair-return-mini"
                                  title="Transfer request pending"
                                >
                                  <ArrowRightLeft
                                    size={10}
                                  />
                                  Transfer
                                </span>
                              )}

                            </div>
                          </td>

                          {/* CUSTOMER */}

                          <td>
                            <div className="repair-customer">

                              <div className="repair-customer-avatar">
                                <User
                                  size={
                                    16
                                  }
                                />
                              </div>

                              <div>
                                <strong>
                                  {
                                    customer
                                  }
                                </strong>

                                <span>
                                  <Phone
                                    size={
                                      11
                                    }
                                  />

                                  {
                                    phone
                                  }
                                </span>
                              </div>

                            </div>
                          </td>

                          {/* DEVICE */}

                          <td>
                            <div className="repair-device">

                              <strong>
                                {
                                  device
                                }
                              </strong>

                              <span>
                                {
                                  issue
                                }
                              </span>

                              {stage ===
                                REPAIR_STAGES.WAITING_PART &&
                                job
                                  ?.partRequirement
                                  ?.partName && (
                                  <small
                                    style={{
                                      display:
                                        "block",

                                      marginTop:
                                        "4px",

                                      color:
                                        "#9a6700",

                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    Part:{" "}
                                    {
                                      job
                                        .partRequirement
                                        .partName
                                    }
                                  </small>
                                )}

                              {job.status ===
                                "Returned" &&
                                job.returnReason && (
                                  <small className="repair-return-reason">
                                    Return:{" "}
                                    {
                                      job.returnReason
                                    }
                                  </small>
                                )}

                            </div>
                          </td>

                          {/* TECHNICIAN */}

                          <td>
                            <span
                              className={
                                technician ===
                                "Unassigned"
                                  ? "repair-unassigned-tech"
                                  : ""
                              }
                            >
                              {
                                technician
                              }
                            </span>
                          </td>

                          {/* V2 STAGE */}

                          <td>
                            <div
                              style={{
                                display:
                                  "flex",

                                flexDirection:
                                  "column",

                                alignItems:
                                  "flex-start",

                                gap:
                                  "4px",
                              }}
                            >
                              <span
                                className={getStageClass(
                                  stage,
                                  job.status
                                )}
                              >
                                {
                                  stage
                                }
                              </span>

                              {job.status &&
                                job.status !==
                                  stage && (
                                  <small
                                    style={{
                                      fontSize:
                                        "9px",

                                      color:
                                        "#98a2b3",
                                    }}
                                  >
                                    System:{" "}
                                    {
                                      job.status
                                    }
                                  </small>
                                )}
                            </div>
                          </td>

                          {/* PAYMENT */}

                          <td>
                            <span
                              className={getPaymentClass(
                                payment
                              )}
                            >
                              {
                                payment
                              }
                            </span>
                          </td>

                          {/* AMOUNT */}

                          <td>
                            <strong className="repair-amount">
                              ₹
                              {getAmount(
                                job
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                            {getBalance(
                              job
                            ) > 0 && (
                              <small
                                style={{
                                  display:
                                    "block",

                                  marginTop:
                                    "3px",

                                  color:
                                    "#98a2b3",

                                  fontSize:
                                    "9px",
                                }}
                              >
                                Due ₹
                                {getBalance(
                                  job
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </small>
                            )}
                          </td>

                          {/* RECEIVED */}

                          <td>
                            {getReceived(
                              job
                            )}
                          </td>

                          {/* VIEW */}

                          <td>
                            <button
                              type="button"
                              className="repair-view-btn"
                              aria-label={`View ${job.id}`}
                              onClick={() =>
                                handleViewJob(
                                  job
                                )
                              }
                            >
                              <Eye
                                size={
                                  17
                                }
                              />
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* ================= MOBILE ================= */}

            <div className="repair-mobile-list">

              {filteredJobs.map(
                (
                  job
                ) => {
                  const technician =
                    getTechnician(
                      job
                    );

                  const payment =
                    getPayment(
                      job
                    );

                  const stage =
                    getRepairStage(
                      job
                    );

                  const transferPending =
                    normalizeText(
                      job
                        ?.transferRequest
                        ?.status
                    ) ===
                    "pending";

                  return (
                    <article
                      className={`repair-mobile-card ${
                        job.status ===
                        "Returned"
                          ? "returned"
                          : ""
                      }`}
                      key={
                        job.id
                      }
                    >

                      {/* TOP */}

                      <div className="repair-mobile-top">

                        <div>
                          <span>
                            {
                              job.id
                            }
                          </span>

                          <strong>
                            {getDevice(
                              job
                            )}
                          </strong>
                        </div>

                        <span
                          className={getStageClass(
                            stage,
                            job.status
                          )}
                        >
                          {
                            stage
                          }
                        </span>

                      </div>

                      {/* CUSTOMER STATUS */}

                      {job.customerStatus && (
                        <div
                          style={{
                            margin:
                              "10px 0",

                            padding:
                              "9px 10px",

                            borderRadius:
                              "9px",

                            background:
                              "#f8fafc",

                            border:
                              "1px solid #eef2f6",

                            fontSize:
                              "10px",

                            color:
                              "#667085",
                          }}
                        >
                          <ShieldCheck
                            size={12}
                            style={{
                              verticalAlign:
                                "middle",

                              marginRight:
                                "5px",
                            }}
                          />

                          {
                            job.customerStatus
                          }
                        </div>
                      )}

                      {/* RETURN */}

                      {job.returnCount >
                        0 && (
                        <div className="repair-mobile-return-banner">
                          <RotateCcw
                            size={
                              14
                            }
                          />

                          <div>
                            <strong>
                              Returned{" "}
                              {
                                job.returnCount
                              }
                              x
                            </strong>

                            <span>
                              {job.returnType ||
                                "Return Repair"}

                              {job.returnReason
                                ? ` · ${job.returnReason}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* TRANSFER */}

                      {transferPending && (
                        <div
                          style={{
                            margin:
                              "10px 0",

                            padding:
                              "10px",

                            borderRadius:
                              "9px",

                            background:
                              "#f6f9ff",

                            border:
                              "1px solid #dce6f7",

                            fontSize:
                              "10px",
                          }}
                        >
                          <ArrowRightLeft
                            size={13}
                            style={{
                              verticalAlign:
                                "middle",

                              marginRight:
                                "5px",
                            }}
                          />

                          Transfer pending:{" "}

                          <strong>
                            {
                              job
                                ?.transferRequest
                                ?.requestedByName ||
                              technician
                            }
                          </strong>

                          {" → "}

                          <strong>
                            {
                              job
                                ?.transferRequest
                                ?.targetTechnicianName ||
                              "Technician"
                            }
                          </strong>
                        </div>
                      )}

                      {/* CUSTOMER */}

                      <div className="repair-mobile-customer">

                        <strong>
                          {getCustomer(
                            job
                          )}
                        </strong>

                        <span>
                          {getPhone(
                            job
                          )}
                        </span>

                      </div>

                      {/* ISSUE */}

                      <div className="repair-mobile-issue">

                        <span>
                          Issue
                        </span>

                        <strong>
                          {getIssue(
                            job
                          )}
                        </strong>

                      </div>

                      {/* WAITING PART */}

                      {stage ===
                        REPAIR_STAGES.WAITING_PART && (
                        <div className="repair-mobile-issue">

                          <span>
                            Required Part
                          </span>

                          <strong>
                            {job
                              ?.partRequirement
                              ?.partName ||
                              "Part Required"}
                          </strong>

                        </div>
                      )}

                      {/* META */}

                      <div className="repair-mobile-meta">

                        <div>
                          <span>
                            Technician
                          </span>

                          <strong>
                            {
                              technician
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Payment
                          </span>

                          <strong>
                            {
                              payment
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Amount
                          </span>

                          <strong>
                            ₹
                            {getAmount(
                              job
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>
                        </div>

                      </div>

                      {/* BATTERY */}

                      {job.batteryUsed &&
                        job.battery && (
                        <div className="repair-mobile-issue">

                          <span>
                            Battery
                          </span>

                          <strong>
                            {job.battery
                              .model ||
                              "Battery"}

                            {" • "}

                            {job.battery
                              .status ||
                              "Required"}
                          </strong>

                        </div>
                      )}

                      {/* VIEW */}

                      <button
                        type="button"
                        className="repair-mobile-view"
                        onClick={() =>
                          handleViewJob(
                            job
                          )
                        }
                      >
                        View Job Details

                        <Eye
                          size={
                            16
                          }
                        />
                      </button>

                    </article>
                  );
                }
              )}

            </div>

            {/* ================= EMPTY ================= */}

            {filteredJobs.length ===
              0 && (
              <div className="repair-empty-state">

                <Search
                  size={
                    25
                  }
                />

                <strong>
                  No repair jobs
                  found
                </strong>

                <span>
                  Try another
                  search, repair
                  stage or status.
                </span>

              </div>
            )}

          </>
        )}

      </section>

      {/* ================= NEW JOB ================= */}

      <NewRepairJobModal
        isOpen={
          isNewJobOpen
        }
        onClose={() =>
          setIsNewJobOpen(
            false
          )
        }
        onCreateJob={
          handleCreateJob
        }
        technicians={
          availableTechnicians
        }
      />

      {/* ================= JOB DETAILS ================= */}

      <JobDetailsModal
        isOpen={
          isDetailsOpen
        }
        job={
          selectedJob
        }
        onClose={
          handleCloseDetails
        }
        onUpdateJob={
          handleUpdateJob
        }
      />

    </div>
  );
};

export default RepairJobs;