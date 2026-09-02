import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  IndianRupee,
  LogIn,
  LogOut,
  PackageCheck,
  PauseCircle,
  Power,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards,
  Wrench,
  X,
  XCircle,
  ArrowRightLeft,
} from "lucide-react";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import "../dashboard.css";

/* =========================================================
   REPAIR STAGES
========================================================= */

const REPAIR_STAGES = {
  RECEIVED:
    "Device Received",

  DIAGNOSIS:
    "Diagnosis",

  WAITING_APPROVAL:
    "Waiting Customer Approval",

  APPROVED:
    "Approved",

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

  REJECTED:
    "Repair Rejected",

  RETURNED:
    "Returned to Reception",
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (
  value
) =>
  String(value || "")
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

const getTimestampDate = (
  value
) => {
  if (!value) {
    return null;
  }

  if (
    typeof value.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const timestampToMillis = (
  value
) => {
  const date =
    getTimestampDate(
      value
    );

  return date
    ? date.getTime()
    : 0;
};

const getLocalDateKey = (
  date = new Date()
) => {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};

const isToday = (
  value
) => {
  const date =
    getTimestampDate(
      value
    );

  if (!date) {
    return false;
  }

  const now =
    new Date();

  return (
    date.getDate() ===
      now.getDate() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getFullYear() ===
      now.getFullYear()
  );
};

const formatSeconds = (
  totalSeconds
) => {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(
        toNumber(
          totalSeconds
        )
      )
    );

  const hours =
    Math.floor(
      safeSeconds /
        3600
    );

  const minutes =
    Math.floor(
      (
        safeSeconds %
        3600
      ) / 60
    );

  const seconds =
    safeSeconds %
    60;

  const pad =
    (value) =>
      String(
        value
      ).padStart(
        2,
        "0"
      );

  return `${pad(
    hours
  )}:${pad(
    minutes
  )}:${pad(
    seconds
  )}`;
};

const formatAttendanceTime = (
  value
) => {
  const date =
    getTimestampDate(
      value
    );

  if (!date) {
    return "--:--";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        true,
    }
  );
};

const formatCurrency = (
  value
) =>
  `₹${toNumber(
    value
  ).toLocaleString(
    "en-IN"
  )}`;

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
      return REPAIR_STAGES
        .RECEIVED;

    case "In Progress":
      return REPAIR_STAGES
        .REPAIR;

    case "Ready":
      return REPAIR_STAGES
        .READY;

    case "Completed":
      return REPAIR_STAGES
        .DELIVERED;

    case "Returned":
      return REPAIR_STAGES
        .RETURNED;

    default:
      return (
        job?.status ||
        REPAIR_STAGES
          .RECEIVED
      );
  }
};

const getCustomer = (
  job
) =>
  job?.customer ||
  job?.customerName ||
  "Unknown Customer";

const getDevice = (
  job
) =>
  job?.device ||
  `${job?.brand || ""} ${
    job?.model || ""
  }`.trim() ||
  "Device";

const getIssue = (
  job
) =>
  job?.issue ||
  job?.reportedProblem ||
  job?.problem ||
  "Issue not specified";

const getTechnician = (
  job
) =>
  job?.technician ||
  job?.technicianName ||
  job?.assignedTo ||
  job?.assignedTechnician ||
  "Unassigned";

const getAmount = (
  job
) =>
  toNumber(
    job?.estimate
      ?.totalAmount ??
      job?.totalAmount ??
      job?.amount ??
      job?.estimatedCharge
  );

const getReceivedAmount = (
  job
) => {
  const explicit =
    job?.receivedAmount ??
    job?.paidAmount;

  if (
    explicit !==
      undefined &&
    explicit !== null
  ) {
    return toNumber(
      explicit
    );
  }

  return toNumber(
    job?.advance ??
      job?.advanceReceived
  );
};

const getStaffName = (
  member
) =>
  member?.name ||
  member?.fullName ||
  member?.technicianName ||
  member?.receptionistName ||
  member?.email ||
  "Staff Member";

/* =========================================================
   DASHBOARD
========================================================= */

const Dashboard = () => {
  const navigate =
    useNavigate();

  /* =======================================================
     MAIN DATA
  ======================================================= */

  const [
    jobs,
    setJobs,
  ] = useState([]);

  const [
    technicians,
    setTechnicians,
  ] = useState([]);

  const [
    staffMembers,
    setStaffMembers,
  ] = useState([]);

  const [
    attendanceRecords,
    setAttendanceRecords,
  ] = useState([]);

  const [
    shopStatus,
    setShopStatus,
  ] = useState({
    isOpen: true,
    status: "Open",
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    shopStatusLoading,
    setShopStatusLoading,
  ] = useState(false);

  /* =======================================================
     OWNER V2 ACTIONS
  ======================================================= */

  const [
    workflowLoading,
    setWorkflowLoading,
  ] = useState("");

  const [
    workflowError,
    setWorkflowError,
  ] = useState("");

  const [
    rejectApprovalJobId,
    setRejectApprovalJobId,
  ] = useState(null);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  /* =======================================================
     ATTENDANCE MODAL
  ======================================================= */

  const [
    attendanceModalOpen,
    setAttendanceModalOpen,
  ] = useState(false);

  const [
    selectedStaffId,
    setSelectedStaffId,
  ] = useState("");

  const [
    selectedAttendanceDate,
    setSelectedAttendanceDate,
  ] = useState(null);

  const [
    attendanceMonth,
    setAttendanceMonth,
  ] = useState(() => {
    const now =
      new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  });

  const todayDate =
    getLocalDateKey();

  /* =======================================================
     FIRESTORE — JOBS
  ======================================================= */

  useEffect(() => {
    const jobsQuery =
      query(
        collection(
          db,
          "repairJobs"
        ),

        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        jobsQuery,

        (snapshot) => {
          setJobs(
            snapshot.docs.map(
              (
                document
              ) => ({
                id:
                  document.id,

                ...document.data(),
              })
            )
          );

          setLoading(
            false
          );
        },

        (error) => {
          console.error(
            "Dashboard jobs error:",
            error
          );

          setLoading(
            false
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     FIRESTORE — USERS
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "users"
        ),

        (snapshot) => {
          const allStaff =
            [];

          const techs =
            [];

          snapshot.forEach(
            (
              document
            ) => {
              const data =
                document.data();

              const role =
                normalizeText(
                  data.role
                );

              if (
                role !==
                  "technician" &&
                role !==
                  "receptionist"
              ) {
                return;
              }

              const member = {
                id:
                  document.id,

                uid:
                  document.id,

                ...data,
              };

              allStaff.push(
                member
              );

              if (
                role ===
                "technician"
              ) {
                techs.push(
                  member
                );
              }
            }
          );

          setStaffMembers(
            allStaff
          );

          setTechnicians(
            techs
          );
        },

        (error) => {
          console.error(
            "Dashboard users error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     FIRESTORE — ATTENDANCE
  ======================================================= */

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "attendance"
        ),

        (snapshot) => {
          setAttendanceRecords(
            snapshot.docs.map(
              (
                document
              ) => ({
                id:
                  document.id,

                ...document.data(),
              })
            )
          );
        },

        (error) => {
          console.error(
            "Attendance listener error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     FIRESTORE — SHOP STATUS
  ======================================================= */

  useEffect(() => {
    const shopRef =
      doc(
        db,
        "systemSettings",
        "shop"
      );

    const unsubscribe =
      onSnapshot(
        shopRef,

        (document) => {
          if (
            document.exists()
          ) {
            const data =
              document.data();

            setShopStatus({
              isOpen:
                data.isOpen !==
                false,

              status:
                data.status ||
                (
                  data.isOpen ===
                  false
                    ? "Closed"
                    : "Open"
                ),

              ...data,
            });
          } else {
            setShopStatus({
              isOpen:
                true,

              status:
                "Open",
            });
          }
        },

        (error) => {
          console.error(
            "Shop status listener error:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =======================================================
     SHOP CONTROL
  ======================================================= */

  const handleSetShopStatus =
    async (
      shouldOpen
    ) => {
      if (
        shopStatusLoading
      ) {
        return;
      }

      if (
        !shouldOpen
      ) {
        const confirmShutdown =
          window.confirm(
            "Shut down Ansar Telecom operations now?\n\nTechnicians and Reception will see SHOP CLOSED."
          );

        if (
          !confirmShutdown
        ) {
          return;
        }
      }

      try {
        setShopStatusLoading(
          true
        );

        await setDoc(
          doc(
            db,
            "systemSettings",
            "shop"
          ),

          {
            isOpen:
              shouldOpen,

            status:
              shouldOpen
                ? "Open"
                : "Closed",

            updatedAt:
              serverTimestamp(),

            updatedBy:
              auth.currentUser
                ?.uid ||
              "",

            updatedByEmail:
              auth.currentUser
                ?.email ||
              "",
          },

          {
            merge: true,
          }
        );
      } catch (error) {
        alert(
          "Unable to update shop status: " +
            error.message
        );
      } finally {
        setShopStatusLoading(
          false
        );
      }
    };

  /* =======================================================
     STAFF STATUS
  ======================================================= */

  const getStaffLiveStatus =
    (member) => {
      if (!member) {
        return "Off Duty";
      }

      const attendanceToday =
        member.attendanceDate ===
        todayDate;

      const presenceStatus =
        normalizeText(
          member.presenceStatus
        );

      const availabilityStatus =
        normalizeText(
          member.availabilityStatus
        );

      if (
        !attendanceToday ||
        presenceStatus !==
          "present"
      ) {
        return "Off Duty";
      }

      if (
        availabilityStatus ===
          "on break" ||
        availabilityStatus ===
          "break" ||
        availabilityStatus ===
          "lunch"
      ) {
        return "On Break";
      }

      if (
        normalizeText(
          member.role
        ) ===
        "receptionist"
      ) {
        return "Present";
      }

      const memberJobs =
        jobs.filter(
          (job) => {
            const ids = [
              job.technicianId,
              job.technicianUid,
              job.assignedTechnicianId,
              job.assignedToId,
            ]
              .filter(
                Boolean
              )
              .map(
                String
              );

            const active =
              [
                "Pending",
                "In Progress",
                "Paused",
              ].includes(
                job.status
              );

            return (
              ids.includes(
                String(
                  member.id
                )
              ) &&
              active
            );
          }
        );

      return memberJobs.length >
        0
        ? "Busy"
        : "Available";
    };

  /* =======================================================
     V2 CUSTOMER APPROVAL — OWNER
  ======================================================= */

  const handleApproveRepair =
    async (
      job
    ) => {
      if (!job?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          `Confirm customer approval for ${job.id}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setWorkflowError(
          ""
        );

        setWorkflowLoading(
          `approve-${job.id}`
        );

        const partStatus =
          normalizeText(
            job
              .partRequirement
              ?.status
          );

        const partRequired =
          partStatus ===
            "required" ||
          partStatus ===
            "pending";

        const pausedAt =
          timestampToMillis(
            job.pausedAt
          );

        const additionalPausedSeconds =
          pausedAt
            ? Math.max(
                0,

                Math.floor(
                  (
                    Date.now() -
                    pausedAt
                  ) / 1000
                )
              )
            : 0;

        const oldPaused =
          toNumber(
            job.totalPausedSeconds
          );

        const updates = {
          "customerApproval.status":
            "Approved",

          "customerApproval.source":
            "Owner",

          "customerApproval.respondedAt":
            serverTimestamp(),

          "customerApproval.approvedAt":
            serverTimestamp(),

          "customerApproval.rejectedAt":
            null,

          approvalConfirmedBy:
            auth.currentUser
              ?.uid ||
            "Owner",

          approvalConfirmedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        };

        if (
          partRequired
        ) {
          updates.status =
            "Paused";

          updates.repairStage =
            REPAIR_STAGES
              .WAITING_PART;

          updates.customerStatus =
            "Your repair is approved. The required part is being arranged.";

          updates.customerStatusCode =
            "WAITING_PART";

          updates.pauseReason =
            "Waiting for Part";
        } else {
          updates.status =
            "In Progress";

          updates.repairStage =
            REPAIR_STAGES
              .REPAIR;

          updates.customerStatus =
            "Your repair has been approved and repair work is in progress.";

          updates.customerStatusCode =
            "REPAIR_IN_PROGRESS";

          updates.totalPausedSeconds =
            oldPaused +
            additionalPausedSeconds;

          updates.pausedAt =
            null;

          updates.pauseReason =
            "";
        }

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),

          updates
        );

        setRejectApprovalJobId(
          null
        );

        setRejectionReason(
          ""
        );
      } catch (error) {
        console.error(
          "Owner approval failed:",
          error
        );

        setWorkflowError(
          error?.message ||
            "Unable to approve repair."
        );
      } finally {
        setWorkflowLoading(
          ""
        );
      }
    };

  const handleRejectRepair =
    async (
      job
    ) => {
      if (!job?.id) {
        return;
      }

      const reason =
        rejectionReason.trim();

      if (!reason) {
        setWorkflowError(
          "Rejection reason is required."
        );

        return;
      }

      try {
        setWorkflowError(
          ""
        );

        setWorkflowLoading(
          `reject-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),

          {
            status:
              "Returned",

            repairStage:
              REPAIR_STAGES
                .REJECTED,

            customerStatus:
              "Repair was not approved. Your device will be prepared for return.",

            customerStatusCode:
              "REPAIR_NOT_APPROVED",

            "customerApproval.status":
              "Rejected",

            "customerApproval.source":
              "Owner",

            "customerApproval.respondedAt":
              serverTimestamp(),

            "customerApproval.rejectedAt":
              serverTimestamp(),

            "customerApproval.approvedAt":
              null,

            "customerApproval.notes":
              reason,

            rejectionReason:
              reason,

            repairRejectedAt:
              serverTimestamp(),

            "delivery.status":
              "Awaiting Customer Collection",

            pausedAt:
              null,

            pauseReason:
              "",

            updatedAt:
              serverTimestamp(),
          }
        );

        setRejectApprovalJobId(
          null
        );

        setRejectionReason(
          ""
        );
      } catch (error) {
        console.error(
          "Owner rejection failed:",
          error
        );

        setWorkflowError(
          error?.message ||
            "Unable to reject repair."
        );
      } finally {
        setWorkflowLoading(
          ""
        );
      }
    };

  /* =======================================================
     TRANSFER REQUEST — OWNER
  ======================================================= */

  const handleTransferRequest = async (job, approve) => {
    const request = job?.transferRequest;

    if (!job?.id || normalizeText(request?.status) !== "pending") return;

    const confirmed = window.confirm(
      approve
        ? `Approve transfer of ${job.id} to ${request.targetTechnicianName || "selected technician"}?`
        : `Reject transfer request for ${job.id}?`
    );
    if (!confirmed) return;

    try {
      setWorkflowError("");
      setWorkflowLoading(`${approve ? "transfer-approve" : "transfer-reject"}-${job.id}`);

      const ownerUid = auth.currentUser?.uid || "";
      const ownerName = "Owner";
      const decisionTime = new Date().toISOString();
      const fromTechnicianId =
        request.requestedByUid || job.technicianId || job.technicianUid || job.assignedTechnicianId || "";
      const fromTechnicianName = request.requestedByName || getTechnician(job);
      const targetUid = request.targetTechnicianId || request.targetTechnicianUid || "";
      const targetName = request.targetTechnicianName || request.targetTechnician || "";
      const previousStatus = request.previousStatus || job.status || "Pending";
      const previousRepairStage = request.previousRepairStage || getRepairStage(job);

      if (!approve) {
        await updateDoc(doc(db, "repairJobs", job.id), {
          "transferRequest.status": "rejected",
          "transferRequest.decidedByUid": ownerUid,
          "transferRequest.decidedByName": ownerName,
          "transferRequest.decidedAt": serverTimestamp(),
          jobHistory: arrayUnion({
            action: "Transfer Rejected",
            jobId: job.id,
            requestedByUid: request.requestedByUid || "",
            requestedByName: fromTechnicianName,
            targetTechnicianId: targetUid,
            targetTechnicianName: targetName,
            reason: request.reason || "",
            previousStatus,
            previousRepairStage,
            decidedByUid: ownerUid,
            decidedByName: ownerName,
            actionAt: decisionTime,
          }),
          updatedAt: serverTimestamp(),
        });
        return;
      }

      if (!targetUid && !targetName) {
        throw new Error("Transfer request has no target technician.");
      }

      const normalizedPreviousStatus = normalizeText(previousStatus);
      let nextStatus = previousStatus;
      if (normalizedPreviousStatus === "in progress") nextStatus = "Paused";
      else if (normalizedPreviousStatus === "pending") nextStatus = "Pending";
      else if (normalizedPreviousStatus === "paused") nextStatus = "Paused";

      const transferHistoryEntry = {
        action: "Transfer Approved",
        jobId: job.id,
        fromTechnicianId,
        fromTechnicianName,
        toTechnicianId: targetUid,
        toTechnicianName: targetName,
        reason: request.reason || "",
        workedSeconds: toNumber(request.workedSeconds),
        previousStatus,
        newStatus: nextStatus,
        previousRepairStage,
        repairStage: previousRepairStage,
        decidedByUid: ownerUid,
        decidedByName: ownerName,
        actionAt: decisionTime,
      };

      const transferAuditEntry = {
        fromTechnicianId,
        fromTechnicianName,
        toTechnicianId: targetUid,
        toTechnicianName: targetName,
        reason: request.reason || "",
        previousStatus,
        handoffStatus: nextStatus,
        repairStage: previousRepairStage,
        approvedByUid: ownerUid,
        approvedByName: ownerName,
        transferredAt: decisionTime,
      };

      const updates = {
        technician: targetName,
        technicianName: targetName,
        assignedTechnician: targetName,
        assignedTo: targetName,
        technicianId: targetUid,
        technicianUid: targetUid,
        assignedTechnicianId: targetUid,
        assignedToId: targetUid,
        assignedAt: serverTimestamp(),
        status: nextStatus,
        repairStage: previousRepairStage,
        "transferRequest.status": "approved",
        "transferRequest.decidedByUid": ownerUid,
        "transferRequest.decidedByName": ownerName,
        "transferRequest.decidedAt": serverTimestamp(),
        transferredAt: serverTimestamp(),
        transferredBy: ownerName,
        transferredByUid: ownerUid,
        jobHistory: arrayUnion(transferHistoryEntry),
        transferHistory: arrayUnion(transferAuditEntry),
        updatedAt: serverTimestamp(),
      };

      // Safe handoff: an actively running repair pauses for the new technician.
      // startedAt, totalPausedSeconds and totalTimeSeconds are intentionally untouched.
      if (normalizedPreviousStatus === "in progress") {
        updates.pausedAt = serverTimestamp();
        updates.pauseReason = "Transferred - waiting for technician to resume";
        updates.stageBeforePause = previousRepairStage;
      }

      // If it was already paused, do not overwrite pausedAt/pauseReason.
      await updateDoc(doc(db, "repairJobs", job.id), updates);
    } catch (error) {
      console.error("Transfer decision failed:", error);
      setWorkflowError(error?.message || "Unable to process transfer request.");
    } finally {
      setWorkflowLoading("");
    }
  };

  /* =======================================================
     DATA CALCULATIONS
  ======================================================= */

  const data =
    useMemo(() => {
      const todaysJobs =
        jobs.filter(
          (job) =>
            isToday(
              job.createdAt
            )
        );

      const pendingJobs =
        jobs.filter(
          (job) =>
            job.status ===
            "Pending"
        );

      const inProgressJobs =
        jobs.filter(
          (job) =>
            job.status ===
            "In Progress"
        );

      const pausedJobs =
        jobs.filter(
          (job) =>
            job.status ===
            "Paused"
        );

      const returnedJobs =
        jobs.filter(
          (job) =>
            job.status ===
            "Returned"
        );

      const readyJobs =
        jobs.filter(
          (job) =>
            job.status ===
              "Ready" ||
            getRepairStage(
              job
            ) ===
              REPAIR_STAGES.READY
        );

      const completedJobs =
        jobs.filter(
          (job) =>
            job.status ===
              "Completed" ||
            getRepairStage(
              job
            ) ===
              REPAIR_STAGES
                .DELIVERED
        );

      const waitingApprovalJobs =
        jobs.filter(
          (job) =>
            getRepairStage(
              job
            ) ===
            REPAIR_STAGES
              .WAITING_APPROVAL
        );

      const waitingPartJobs =
        jobs.filter(
          (job) =>
            getRepairStage(
              job
            ) ===
            REPAIR_STAGES
              .WAITING_PART
        );

      const testingJobs =
        jobs.filter(
          (job) =>
            getRepairStage(
              job
            ) ===
            REPAIR_STAGES
              .TESTING
        );

      const transferRequests =
        jobs.filter(
          (job) =>
            normalizeText(
              job.transferRequest
                ?.status
            ) ===
            "pending"
        );

      const unassignedJobs =
        jobs.filter(
          (job) => {
            const unassigned =
              getTechnician(
                job
              ) ===
                "Unassigned" ||
              !String(
                job.technicianId ||
                  job.technicianUid ||
                  job.assignedTechnicianId ||
                  ""
              ).trim();

            return (
              unassigned &&
              job.status !==
                "Completed"
            );
          }
        );

      const urgentJobs =
        jobs.filter(
          (job) =>
            job.status !==
              "Completed" &&
            (
              job.priority ===
                "Urgent" ||
              job.priority ===
                "High Priority"
            )
        );

      const totalReceivable =
        jobs.reduce(
          (
            total,
            job
          ) =>
            total +
            Math.max(
              getAmount(
                job
              ) -
                getReceivedAmount(
                  job
                ),
              0
            ),

          0
        );

      const totalReceived =
        jobs.reduce(
          (
            total,
            job
          ) =>
            total +
            getReceivedAmount(
              job
            ),

          0
        );

      const todayReceived =
        todaysJobs.reduce(
          (
            total,
            job
          ) =>
            total +
            getReceivedAmount(
              job
            ),

          0
        );

      const todayPending =
        todaysJobs.reduce(
          (
            total,
            job
          ) =>
            total +
            Math.max(
              getAmount(
                job
              ) -
                getReceivedAmount(
                  job
                ),

              0
            ),

          0
        );

      const batteryJobs =
        jobs.filter(
          (job) =>
            job.batteryUsed &&
            job.battery
        );

      const installedBatteries =
        batteryJobs.filter(
          (job) =>
            job.battery
              ?.status ===
            "Installed"
        ).length;

      const pendingBatteries =
        batteryJobs.filter(
          (job) =>
            job.battery
              ?.payment ===
              "Pending" ||
            job.battery
              ?.status ===
              "Required"
        ).length;

      const batteryProfit =
        batteryJobs.reduce(
          (
            total,
            job
          ) => {
            const quantity =
              toNumber(
                job.battery
                  ?.quantity ||
                  1
              );

            const cost =
              toNumber(
                job.battery
                  ?.costPrice
              );

            const selling =
              toNumber(
                job.battery
                  ?.customerPrice
              );

            return (
              total +
              (
                selling -
                cost
              ) *
                quantity
            );
          },

          0
        );

      const activeTechIds =
        new Set(
          inProgressJobs
            .map(
              (job) =>
                job.technicianId ||
                job.technicianUid ||
                job.assignedTechnicianId
            )
            .filter(
              Boolean
            )
        );

      const presentStaff =
        staffMembers.filter(
          (member) => {
            const status =
              getStaffLiveStatus(
                member
              );

            return [
              "Available",
              "Busy",
              "Present",
              "On Break",
            ].includes(
              status
            );
          }
        );

      return {
        todaysJobs:
          todaysJobs.length,

        pending:
          pendingJobs.length,

        inProgress:
          inProgressJobs.length,

        paused:
          pausedJobs.length,

        returned:
          returnedJobs.length,

        ready:
          readyJobs.length,

        completed:
          completedJobs.length,

        waitingApproval:
          waitingApprovalJobs.length,

        waitingPart:
          waitingPartJobs.length,

        testing:
          testingJobs.length,

        transferRequests:
          transferRequests.length,

        unassigned:
          unassignedJobs.length,

        urgent:
          urgentJobs.length,

        totalReceivable,

        totalReceived,

        todayReceived,

        todayPending,

        batteryJobs:
          batteryJobs.length,

        installedBatteries,

        pendingBatteries,

        batteryProfit,

        activeTechnicians:
          activeTechIds.size,

        presentStaff:
          presentStaff.length,

        recentJobs:
          jobs.slice(
            0,
            6
          ),

        urgentJobs:
          urgentJobs.slice(
            0,
            4
          ),

        waitingApprovalJobs:
          waitingApprovalJobs.slice(
            0,
            5
          ),

        waitingPartJobs:
          waitingPartJobs.slice(
            0,
            5
          ),

        readyJobs:
          readyJobs.slice(
            0,
            5
          ),

        transferRequestJobs:
          transferRequests.slice(
            0,
            5
          ),

        unassignedJobs:
          unassignedJobs.slice(
            0,
            5
          ),
      };
    }, [
      jobs,
      staffMembers,
      todayDate,
    ]);

  /* =======================================================
     TECHNICIAN WORKLOAD
  ======================================================= */

  const technicianWorkload =
    useMemo(() => {
      return technicians
        .map(
          (technician) => {
            const techId =
              String(
                technician.id ||
                  technician.uid ||
                  ""
              );

            const techName =
              normalizeText(
                getStaffName(
                  technician
                )
              );

            const assigned =
              jobs.filter(
                (job) => {
                  const ids = [
                    job.technicianId,
                    job.technicianUid,
                    job.assignedTechnicianId,
                    job.assignedToId,
                  ]
                    .filter(
                      Boolean
                    )
                    .map(
                      String
                    );

                  if (
                    ids.length >
                    0
                  ) {
                    return ids.includes(
                      techId
                    );
                  }

                  return (
                    normalizeText(
                      getTechnician(
                        job
                      )
                    ) ===
                    techName
                  );
                }
              );

            const pending =
              assigned.filter(
                (job) =>
                  job.status ===
                  "Pending"
              ).length;

            const active =
              assigned.filter(
                (job) =>
                  job.status ===
                  "In Progress"
              ).length;

            const paused =
              assigned.filter(
                (job) =>
                  job.status ===
                  "Paused"
              ).length;

            return {
              ...technician,

              liveStatus:
                getStaffLiveStatus(
                  technician
                ),

              pending,

              active,

              paused,

              total:
                pending +
                active +
                paused,
            };
          }
        )
        .sort(
          (
            first,
            second
          ) =>
            second.total -
            first.total
        );
    }, [
      technicians,
      jobs,
      todayDate,
    ]);

  /* =======================================================
     ATTENDANCE
  ======================================================= */

  const attendanceToday =
    useMemo(() => {
      return attendanceRecords.filter(
        (record) =>
          record.date ===
          todayDate
      );
    }, [
      attendanceRecords,
      todayDate,
    ]);

  const staffPresentToday =
    useMemo(() => {
      return staffMembers.filter(
        (member) =>
          attendanceToday.some(
            (record) =>
              (
                record.userId ===
                  member.id ||
                record.technicianId ===
                  member.id ||
                record.receptionistId ===
                  member.id
              ) &&
              record.clockIn
          )
      ).length;
    }, [
      staffMembers,
      attendanceToday,
    ]);

  /* =======================================================
     MAIN STATS
  ======================================================= */

  const stats = [
    {
      title:
        "Today's Jobs",

      value:
        data.todaysJobs,

      description:
        `${jobs.length} total repair records`,

      icon:
        Smartphone,

      tone:
        "blue",
    },

    {
      title:
        "In Progress",

      value:
        data.inProgress,

      description:
        `${data.activeTechnicians} technicians working`,

      icon:
        Activity,

      tone:
        "orange",
    },

    {
      title:
        "Ready Delivery",

      value:
        data.ready,

      description:
        "Waiting for customer handover",

      icon:
        PackageCheck,

      tone:
        "green",
    },

    {
      title:
        "Receivable",

      value:
        formatCurrency(
          data.totalReceivable
        ),

      description:
        "Outstanding repair amount",

      icon:
        IndianRupee,

      tone:
        "purple",

      currency:
        true,
    },
  ];

  /* =======================================================
     ATTENDANCE CALENDAR
  ======================================================= */

  const selectedStaff =
    useMemo(() => {
      if (
        selectedStaffId
      ) {
        return (
          staffMembers.find(
            (member) =>
              String(
                member.id
              ) ===
              String(
                selectedStaffId
              )
          ) ||
          null
        );
      }

      return (
        staffMembers[0] ||
        null
      );
    }, [
      staffMembers,
      selectedStaffId,
    ]);

  useEffect(() => {
    if (
      attendanceModalOpen &&
      !selectedStaffId &&
      staffMembers.length >
        0
    ) {
      setSelectedStaffId(
        staffMembers[0].id
      );
    }
  }, [
    attendanceModalOpen,
    staffMembers,
    selectedStaffId,
  ]);

  const selectedStaffAttendance =
    useMemo(() => {
      if (
        !selectedStaff
      ) {
        return [];
      }

      const expectedPrefix =
        `${attendanceMonth.getFullYear()}-${String(
          attendanceMonth.getMonth() +
            1
        ).padStart(
          2,
          "0"
        )}`;

      return attendanceRecords.filter(
        (record) => {
          const memberMatch =
            record.userId ===
              selectedStaff.id ||
            record.technicianId ===
              selectedStaff.id ||
            record.receptionistId ===
              selectedStaff.id;

          return (
            memberMatch &&
            String(
              record.date ||
                ""
            ).startsWith(
              expectedPrefix
            )
          );
        }
      );
    }, [
      selectedStaff,
      attendanceRecords,
      attendanceMonth,
    ]);

  const attendanceByDate =
    useMemo(() => {
      const map =
        new Map();

      selectedStaffAttendance.forEach(
        (record) => {
          if (
            record.date
          ) {
            map.set(
              record.date,
              record
            );
          }
        }
      );

      return map;
    }, [
      selectedStaffAttendance,
    ]);

  const attendanceCalendarDays =
    useMemo(() => {
      const year =
        attendanceMonth.getFullYear();

      const month =
        attendanceMonth.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const daysInMonth =
        new Date(
          year,
          month + 1,
          0
        ).getDate();

      const startOffset =
        firstDay.getDay();

      const cells =
        [];

      for (
        let index = 0;
        index < startOffset;
        index += 1
      ) {
        cells.push(
          null
        );
      }

      for (
        let day = 1;
        day <=
        daysInMonth;
        day += 1
      ) {
        const date =
          new Date(
            year,
            month,
            day
          );

        const dateKey =
          getLocalDateKey(
            date
          );

        cells.push({
          day,
          date,
          dateKey,

          record:
            attendanceByDate.get(
              dateKey
            ) ||
            null,
        });
      }

      return cells;
    }, [
      attendanceMonth,
      attendanceByDate,
    ]);

  const selectedAttendanceRecord =
    useMemo(() => {
      if (
        !selectedAttendanceDate
      ) {
        return null;
      }

      return (
        attendanceByDate.get(
          selectedAttendanceDate
        ) ||
        null
      );
    }, [
      attendanceByDate,
      selectedAttendanceDate,
    ]);

  const monthlyAttendanceSummary =
    useMemo(() => {
      const present =
        selectedStaffAttendance.filter(
          (record) =>
            record.clockIn
        ).length;

      const leave =
        selectedStaffAttendance.filter(
          (record) =>
            normalizeText(
              record.status
            ) ===
            "leave"
        ).length;

      const workedSeconds =
        selectedStaffAttendance.reduce(
          (
            total,
            record
          ) =>
            total +
            toNumber(
              record.workedSeconds
            ),

          0
        );

      return {
        present,
        leave,
        workedSeconds,
      };
    }, [
      selectedStaffAttendance,
    ]);

  const changeAttendanceMonth =
    (
      direction
    ) => {
      setAttendanceMonth(
        (previous) =>
          new Date(
            previous.getFullYear(),
            previous.getMonth() +
              direction,
            1
          )
      );

      setSelectedAttendanceDate(
        null
      );
    };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const openRepairJob =
    (
      jobId
    ) => {
      navigate(
        "/repair-jobs",
        {
          state: {
            openJobId:
              jobId,
          },
        }
      );
    };

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <>
      <section className="dashboard-content admin-dashboard-content">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="admin-hero">

          <div className="admin-hero-grid" />

          <div className="admin-hero-orb admin-orb-one" />

          <div className="admin-hero-orb admin-orb-two" />

          <div className="admin-hero-content">

            <div className="admin-hero-eyebrow">
              <Sparkles
                size={15}
              />

              ANSAR TELECOM
              ADMINISTRATION
            </div>

            <h2>
              Business
              operations,
              <br />

              <span>
                beautifully
                controlled.
              </span>
            </h2>

            <p>
              Live control over
              repairs, approvals,
              technicians,
              payments,
              deliveries,
              attendance and
              shop operations.
            </p>

            <div className="admin-hero-actions">

              <button
                className="admin-primary-action"
                onClick={() =>
                  navigate(
                    "/repair-jobs"
                  )
                }
              >
                <Wrench
                  size={18}
                />

                Repair Jobs

                <ArrowRight
                  size={17}
                />
              </button>

              <button
                className="admin-secondary-action"
                onClick={() =>
                  setAttendanceModalOpen(
                    true
                  )
                }
              >
                <CalendarDays
                  size={18}
                />

                Attendance
              </button>
            </div>
          </div>

          <div className="admin-hero-side">

            <div className="admin-command-card">

              <div
                className={`admin-command-status ${
                  shopStatus.isOpen
                    ? ""
                    : "closed"
                }`}
              >
                <span />

                {shopStatus.isOpen
                  ? "SHOP OPEN"
                  : "SHOP CLOSED"}
              </div>

              <div className="admin-command-logo">
                <ShieldCheck
                  size={27}
                />
              </div>

              <strong>
                ANSAR TELECOM
              </strong>

              <p>
                Owner Control
                Center
              </p>

              <div className="admin-command-footer">
                <Activity
                  size={16}
                />

                Live Operations
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            SHOP CONTROL
        ================================================= */}

        <section
          className={`admin-shop-control ${
            shopStatus.isOpen
              ? "open"
              : "closed"
          }`}
        >
          <div className="admin-shop-status-main">

            <div className="admin-shop-status-icon">
              {shopStatus.isOpen ? (
                <Store
                  size={23}
                />
              ) : (
                <Power
                  size={23}
                />
              )}
            </div>

            <div>
              <span className="admin-section-label">
                SHOP OPERATIONS
              </span>

              <h3>
                {shopStatus.isOpen
                  ? "Ansar Telecom is Open"
                  : "Ansar Telecom is Shut Down"}
              </h3>

              <p>
                {shopStatus.isOpen
                  ? "Reception and technicians can continue normal daily operations."
                  : "Shop operations are marked closed for staff workspaces."}
              </p>
            </div>
          </div>

          <div className="admin-shop-actions">

            {!shopStatus.isOpen ? (
              <button
                type="button"
                className="admin-shop-open-btn"
                disabled={
                  shopStatusLoading
                }
                onClick={() =>
                  handleSetShopStatus(
                    true
                  )
                }
              >
                <Store
                  size={18}
                />

                {shopStatusLoading
                  ? "Opening..."
                  : "Open Shop"}
              </button>
            ) : (
              <button
                type="button"
                className="admin-shop-close-btn"
                disabled={
                  shopStatusLoading
                }
                onClick={() =>
                  handleSetShopStatus(
                    false
                  )
                }
              >
                <Power
                  size={18}
                />

                {shopStatusLoading
                  ? "Shutting Down..."
                  : "Shut Down Shop"}
              </button>
            )}

            <button
              type="button"
              className="admin-attendance-open-btn"
              onClick={() =>
                setAttendanceModalOpen(
                  true
                )
              }
            >
              <CalendarDays
                size={18}
              />

              Monthly Attendance
            </button>
          </div>
        </section>

        {/* =================================================
            MAIN STATS
        ================================================= */}

        <div className="stats-grid admin-stats-grid">

          {stats.map(
            (
              stat,
              index
            ) => {
              const Icon =
                stat.icon;

              return (
                <article
                  key={
                    stat.title
                  }
                  className="stat-card admin-stat-card"
                  style={{
                    "--admin-delay":
                      `${index * 80}ms`,
                  }}
                >
                  <div className="stat-card-top">

                    <div
                      className={`stat-icon ${stat.tone}`}
                    >
                      <Icon
                        size={21}
                      />
                    </div>

                    <span className="admin-stat-live">
                      LIVE
                    </span>
                  </div>

                  <div
                    className={`stat-value ${
                      stat.currency
                        ? "admin-currency-stat"
                        : ""
                    }`}
                  >
                    {stat.value}
                  </div>

                  <div className="stat-title">
                    {stat.title}
                  </div>

                  <div className="stat-change">
                    {stat.description}
                  </div>
                </article>
              );
            }
          )}
        </div>

        {/* =================================================
            V2 OPERATIONS OVERVIEW
        ================================================= */}

        <section className="admin-overview-strip">

          <div className="admin-overview-item">
            <div>
              <Clock3
                size={19}
              />
            </div>

            <span>
              Pending
            </span>

            <strong>
              {data.pending}
            </strong>
          </div>

          <div className="admin-overview-item">
            <div>
              <ShieldCheck
                size={19}
              />
            </div>

            <span>
              Approval
            </span>

            <strong>
              {
                data.waitingApproval
              }
            </strong>
          </div>

          <div className="admin-overview-item">
            <div>
              <PauseCircle
                size={19}
              />
            </div>

            <span>
              Waiting Part
            </span>

            <strong>
              {
                data.waitingPart
              }
            </strong>
          </div>

          <div className="admin-overview-item">
            <div>
              <ArrowRightLeft
                size={19}
              />
            </div>

            <span>
              Transfers
            </span>

            <strong>
              {
                data.transferRequests
              }
            </strong>
          </div>

          <div className="admin-overview-item">
            <div>
              <UserCheck
                size={19}
              />
            </div>

            <span>
              Staff Present
            </span>

            <strong>
              {staffPresentToday}
              /
              {staffMembers.length}
            </strong>
          </div>
        </section>

        {/* =================================================
            OWNER ACTION CENTER
        ================================================= */}

        {(data.waitingApproval >
          0 ||
          data.waitingPart >
            0 ||
          data.ready > 0 ||
          data.transferRequests >
            0) && (
          <section className="dashboard-card admin-panel-card">

            <div className="card-header admin-card-header">

              <div>
                <span className="admin-section-label">
                  OWNER ACTION CENTER
                </span>

                <h3>
                  Operations
                  Requiring
                  Attention
                </h3>

                <p>
                  Important repair
                  decisions and
                  customer handovers.
                </p>
              </div>

              <AlertCircle
                size={22}
              />
            </div>

            {workflowError && (
              <div
                style={{
                  margin:
                    "0 18px 14px",

                  padding:
                    "10px 12px",

                  borderRadius:
                    "10px",

                  background:
                    "#fff4f4",

                  border:
                    "1px solid #f3cece",

                  color:
                    "#b42318",

                  fontSize:
                    "12px",
                }}
              >
                {workflowError}
              </div>
            )}

            <div
              style={{
                display:
                  "grid",

                gap:
                  "12px",

                padding:
                  "0 18px 18px",
              }}
            >

              {/* APPROVALS */}

              {data.waitingApprovalJobs.map(
                (job) => (
                  <article
                    key={`approval-${job.id}`}
                    style={{
                      padding:
                        "14px",

                      borderRadius:
                        "12px",

                      border:
                        "1px solid #efd8a5",

                      background:
                        "#fffaf0",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        gap:
                          "12px",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <strong>
                          {job.id}
                          {" · "}
                          {getDevice(
                            job
                          )}
                        </strong>

                        <p
                          style={{
                            margin:
                              "4px 0 0",

                            fontSize:
                              "11px",
                          }}
                        >
                          {getCustomer(
                            job
                          )}

                          {" · Estimate "}

                          {formatCurrency(
                            getAmount(
                              job
                            )
                          )}
                        </p>
                      </div>

                      <strong
                        style={{
                          color:
                            "#8a5900",

                          fontSize:
                            "11px",
                        }}
                      >
                        CUSTOMER
                        APPROVAL
                      </strong>
                    </div>

                    {job.diagnosis
                      ?.summary && (
                      <p
                        style={{
                          margin:
                            "10px 0 0",

                          fontSize:
                            "11px",
                        }}
                      >
                        <strong>
                          Diagnosis:
                        </strong>{" "}

                        {
                          job.diagnosis
                            .summary
                        }
                      </p>
                    )}

                    <div
                      style={{
                        display:
                          "flex",

                        gap:
                          "8px",

                        flexWrap:
                          "wrap",

                        marginTop:
                          "12px",
                      }}
                    >
                      <button
                        type="button"
                        disabled={Boolean(
                          workflowLoading
                        )}
                        onClick={() =>
                          handleApproveRepair(
                            job
                          )
                        }
                      >
                        <CheckCircle2
                          size={14}
                        />

                        {workflowLoading ===
                        `approve-${job.id}`
                          ? "Approving..."
                          : "Approve Repair"}
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(
                          workflowLoading
                        )}
                        onClick={() => {
                          setRejectApprovalJobId(
                            job.id
                          );

                          setRejectionReason(
                            ""
                          );

                          setWorkflowError(
                            ""
                          );
                        }}
                      >
                        <XCircle
                          size={14}
                        />

                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openRepairJob(
                            job.id
                          )
                        }
                      >
                        Open Job
                      </button>
                    </div>

                    {rejectApprovalJobId ===
                      job.id && (
                      <div
                        style={{
                          marginTop:
                            "12px",
                        }}
                      >
                        <textarea
                          value={
                            rejectionReason
                          }
                          onChange={(
                            event
                          ) => {
                            setRejectionReason(
                              event.target
                                .value
                            );

                            setWorkflowError(
                              ""
                            );
                          }}
                          placeholder="Reason customer rejected repair..."
                          style={{
                            width:
                              "100%",

                            minHeight:
                              "70px",

                            padding:
                              "10px",

                            border:
                              "1px solid #e3d2d2",

                            borderRadius:
                              "9px",

                            fontFamily:
                              "inherit",
                          }}
                        />

                        <div
                          style={{
                            display:
                              "flex",

                            gap:
                              "8px",

                            marginTop:
                              "8px",
                          }}
                        >
                          <button
                            type="button"
                            disabled={Boolean(
                              workflowLoading
                            )}
                            onClick={() =>
                              handleRejectRepair(
                                job
                              )
                            }
                          >
                            Confirm
                            Rejection
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRejectApprovalJobId(
                                null
                              );

                              setRejectionReason(
                                ""
                              );

                              setWorkflowError(
                                ""
                              );
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              )}

              {/* TRANSFER REQUESTS */}

              {data.transferRequestJobs.map(
                (job) => {
                  const request =
                    job.transferRequest ||
                    {};

                  return (
                    <article
                      key={`transfer-${job.id}`}
                      style={{
                        padding:
                          "14px",

                        borderRadius:
                          "12px",

                        border:
                          "1px solid #d9e4f5",

                        background:
                          "#f7faff",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          gap:
                            "12px",

                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div>
                          <strong>
                            {job.id}
                            {" · "}
                            {getDevice(
                              job
                            )}
                          </strong>

                          <p
                            style={{
                              margin:
                                "4px 0 0",

                              fontSize:
                                "11px",
                            }}
                          >
                            {request.requestedByName ||
                              getTechnician(
                                job
                              )}

                            {" → "}

                            {request.targetTechnicianName ||
                              "Target Technician"}
                          </p>
                        </div>

                        <span
                          style={{
                            color:
                              "#2459a8",

                            fontWeight:
                              800,

                            fontSize:
                              "10px",
                          }}
                        >
                          TRANSFER
                          REQUEST
                        </span>
                      </div>

                      {request.reason && (
                        <p
                          style={{
                            fontSize:
                              "11px",

                            margin:
                              "9px 0 0",
                          }}
                        >
                          <strong>
                            Reason:
                          </strong>{" "}

                          {
                            request.reason
                          }
                        </p>
                      )}

                      <div
                        style={{
                          display:
                            "flex",

                          gap:
                            "8px",

                          flexWrap:
                            "wrap",

                          marginTop:
                            "12px",
                        }}
                      >
                        <button
                          type="button"
                          disabled={Boolean(
                            workflowLoading
                          )}
                          onClick={() =>
                            handleTransferRequest(
                              job,
                              true
                            )
                          }
                        >
                          <CheckCircle2
                            size={14}
                          />

                          Approve Transfer
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(
                            workflowLoading
                          )}
                          onClick={() =>
                            handleTransferRequest(
                              job,
                              false
                            )
                          }
                        >
                          <XCircle
                            size={14}
                          />

                          Reject
                        </button>
                      </div>
                    </article>
                  );
                }
              )}

              {/* WAITING PART */}

              {data.waitingPartJobs.map(
                (job) => (
                  <button
                    key={`part-${job.id}`}
                    type="button"
                    onClick={() =>
                      openRepairJob(
                        job.id
                      )
                    }
                    style={{
                      padding:
                        "14px",

                      borderRadius:
                        "12px",

                      border:
                        "1px solid #dce9fb",

                      background:
                        "#f7faff",

                      textAlign:
                        "left",

                      cursor:
                        "pointer",
                    }}
                  >
                    <Wrench
                      size={15}
                    />

                    <strong
                      style={{
                        marginLeft:
                          "7px",
                      }}
                    >
                      {job.id}
                      {" · Waiting for "}
                      {job
                        .partRequirement
                        ?.partName ||
                        "required part"}
                    </strong>
                  </button>
                )
              )}

              {/* READY */}

              {data.readyJobs.map(
                (job) => (
                  <button
                    key={`ready-${job.id}`}
                    type="button"
                    onClick={() =>
                      openRepairJob(
                        job.id
                      )
                    }
                    style={{
                      padding:
                        "14px",

                      borderRadius:
                        "12px",

                      border:
                        "1px solid #cfe8dc",

                      background:
                        "#f3fbf7",

                      textAlign:
                        "left",

                      cursor:
                        "pointer",
                    }}
                  >
                    <PackageCheck
                      size={15}
                    />

                    <strong
                      style={{
                        marginLeft:
                          "7px",
                      }}
                    >
                      {job.id}
                      {" · "}
                      {getDevice(
                        job
                      )}
                      {" · Ready for Delivery"}
                    </strong>
                  </button>
                )
              )}
            </div>
          </section>
        )}

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="dashboard-grid admin-main-grid">

          {/* RECENT JOBS */}

          <section className="dashboard-card jobs-card admin-panel-card">

            <div className="card-header admin-card-header">

              <div>
                <span className="admin-section-label">
                  LIVE OPERATIONS
                </span>

                <h3>
                  Recent Repair
                  Jobs
                </h3>

                <p>
                  Latest devices
                  across the V2
                  repair workflow.
                </p>
              </div>

              <button
                type="button"
                className="text-button admin-view-button"
                onClick={() =>
                  navigate(
                    "/repair-jobs"
                  )
                }
              >
                View all

                <ChevronRight
                  size={17}
                />
              </button>
            </div>

            {loading ? (
              <div className="admin-dashboard-empty">

                <div className="admin-dashboard-loader" />

                <strong>
                  Loading repair
                  operations
                </strong>
              </div>
            ) : data.recentJobs.length ===
              0 ? (
              <div className="admin-dashboard-empty">

                <Wrench
                  size={27}
                />

                <strong>
                  No repair jobs
                  yet
                </strong>

                <span>
                  New jobs will
                  appear here.
                </span>
              </div>
            ) : (
              <>
                <div className="jobs-table-wrap">

                  <table className="jobs-table admin-jobs-table">

                    <thead>
                      <tr>
                        <th>
                          Job ID
                        </th>

                        <th>
                          Customer /
                          Device
                        </th>

                        <th>
                          Technician
                        </th>

                        <th>
                          Stage
                        </th>

                        <th>
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.recentJobs.map(
                        (job) => {
                          const stage =
                            getRepairStage(
                              job
                            );

                          const statusClass =
                            normalizeText(
                              job.status
                            ).replace(
                              /\s+/g,
                              "-"
                            );

                          return (
                            <tr
                              key={
                                job.id
                              }
                              onClick={() =>
                                openRepairJob(
                                  job.id
                                )
                              }
                            >
                              <td>
                                <strong className="job-id">
                                  {job.id}
                                </strong>
                              </td>

                              <td>
                                <div className="customer-device">

                                  <strong>
                                    {getCustomer(
                                      job
                                    )}
                                  </strong>

                                  <span>
                                    {getDevice(
                                      job
                                    )}
                                    {" · "}
                                    {getIssue(
                                      job
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={
                                    getTechnician(
                                      job
                                    ) ===
                                    "Unassigned"
                                      ? "admin-unassigned"
                                      : "admin-technician-name"
                                  }
                                >
                                  {getTechnician(
                                    job
                                  )}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`admin-job-status admin-job-${statusClass}`}
                                >
                                  <i />

                                  {stage}
                                </span>
                              </td>

                              <td className="job-amount">
                                {formatCurrency(
                                  getAmount(
                                    job
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-jobs-list">

                  {data.recentJobs.map(
                    (job) => (
                      <article
                        className="mobile-job-card"
                        key={
                          job.id
                        }
                        onClick={() =>
                          openRepairJob(
                            job.id
                          )
                        }
                      >
                        <div className="mobile-job-top">

                          <div>
                            <span>
                              {job.id}
                            </span>

                            <strong>
                              {getDevice(
                                job
                              )}
                            </strong>
                          </div>

                          <span className="admin-mobile-status">
                            {getRepairStage(
                              job
                            )}
                          </span>
                        </div>

                        <div className="mobile-job-info">

                          <p>
                            {getCustomer(
                              job
                            )}
                          </p>

                          <span>
                            {getIssue(
                              job
                            )}
                          </span>
                        </div>

                        <div className="mobile-job-bottom">

                          <span>
                            {getTechnician(
                              job
                            )}
                          </span>

                          <strong>
                            {formatCurrency(
                              getAmount(
                                job
                              )
                            )}
                          </strong>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </>
            )}
          </section>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <aside className="dashboard-side-column">

            {/* MONEY */}

            <section className="dashboard-card collection-card admin-panel-card">

              <div className="admin-money-header">

                <div>
                  <span className="admin-section-label">
                    CASH FLOW
                  </span>

                  <p>
                    Today's Repair
                    Value
                  </p>

                  <strong>
                    {formatCurrency(
                      data.todayReceived +
                        data.todayPending
                    )}
                  </strong>
                </div>

                <div className="admin-money-icon">
                  <TrendingUp
                    size={22}
                  />
                </div>
              </div>

              <div className="collection-row">

                <span>
                  <CheckCircle2
                    size={17}
                  />

                  Received
                </span>

                <strong>
                  {formatCurrency(
                    data.todayReceived
                  )}
                </strong>
              </div>

              <div className="collection-row">

                <span>
                  <Clock3
                    size={17}
                  />

                  Pending
                </span>

                <strong>
                  {formatCurrency(
                    data.todayPending
                  )}
                </strong>
              </div>

              <div className="admin-finance-summary">

                <WalletCards
                  size={18}
                />

                <div>
                  <span>
                    Total Received
                  </span>

                  <strong>
                    {formatCurrency(
                      data.totalReceived
                    )}
                  </strong>
                </div>
              </div>
            </section>

            {/* TEAM */}

            <section className="dashboard-card admin-panel-card admin-team-card">

              <div className="card-header compact admin-card-header">

                <div>
                  <span className="admin-section-label">
                    STAFF STATUS
                  </span>

                  <h3>
                    Team Today
                  </h3>

                  <p>
                    Technician +
                    Reception.
                  </p>
                </div>

                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setAttendanceModalOpen(
                      true
                    )
                  }
                >
                  Attendance

                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>

              <div className="admin-team-summary">

                <div>
                  <span>
                    Total
                  </span>

                  <strong>
                    {
                      staffMembers.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Present
                  </span>

                  <strong>
                    {
                      staffPresentToday
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Technicians
                  </span>

                  <strong>
                    {
                      technicians.length
                    }
                  </strong>
                </div>
              </div>

              <div className="admin-live-staff-list">

                {staffMembers
                  .slice(
                    0,
                    5
                  )
                  .map(
                    (member) => {
                      const status =
                        getStaffLiveStatus(
                          member
                        );

                      return (
                        <div
                          key={
                            member.id
                          }
                          className="admin-live-staff-row"
                        >
                          <div className="admin-live-staff-avatar">
                            {getStaffName(
                              member
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {getStaffName(
                                member
                              )}
                            </strong>

                            <span>
                              {normalizeText(
                                member.role
                              ) ===
                              "receptionist"
                                ? "Receptionist"
                                : "Technician"}
                            </span>
                          </div>

                          <small
                            className={`admin-staff-status admin-staff-${normalizeText(
                              status
                            ).replace(
                              /\s+/g,
                              "-"
                            )}`}
                          >
                            {status}
                          </small>
                        </div>
                      );
                    }
                  )}
              </div>
            </section>
          </aside>
        </div>

        {/* =================================================
            TECHNICIAN WORKLOAD
        ================================================= */}

        <section className="dashboard-card admin-panel-card">

          <div className="card-header admin-card-header">

            <div>
              <span className="admin-section-label">
                TECHNICIAN CONTROL
              </span>

              <h3>
                Live Workload
              </h3>

              <p>
                Current technician
                queues across all
                repair stages.
              </p>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() =>
                navigate(
                  "/technicians"
                )
              }
            >
              Manage Team

              <ChevronRight
                size={16}
              />
            </button>
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",

              gap:
                "12px",

              padding:
                "0 18px 18px",
            }}
          >
            {technicianWorkload.map(
              (tech) => (
                <article
                  key={
                    tech.id
                  }
                  style={{
                    padding:
                      "14px",

                    border:
                      "1px solid #edf1f5",

                    borderRadius:
                      "13px",

                    background:
                      "#fff",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      gap:
                        "8px",
                    }}
                  >
                    <div>
                      <strong>
                        {getStaffName(
                          tech
                        )}
                      </strong>

                      <span
                        style={{
                          display:
                            "block",

                          marginTop:
                            "3px",

                          fontSize:
                            "10px",

                          color:
                            "#7c8798",
                        }}
                      >
                        {tech.specialization ||
                          "Mobile Repair"}
                      </span>
                    </div>

                    <small>
                      {
                        tech.liveStatus
                      }
                    </small>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "repeat(3,1fr)",

                      gap:
                        "7px",

                      marginTop:
                        "13px",
                    }}
                  >
                    <div>
                      <strong>
                        {
                          tech.pending
                        }
                      </strong>

                      <small>
                        Pending
                      </small>
                    </div>

                    <div>
                      <strong>
                        {
                          tech.active
                        }
                      </strong>

                      <small>
                        Active
                      </small>
                    </div>

                    <div>
                      <strong>
                        {
                          tech.paused
                        }
                      </strong>

                      <small>
                        Paused
                      </small>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        {/* =================================================
            LOWER GRID
        ================================================= */}

        <div className="admin-lower-grid">

          {/* BATTERY */}

          <section className="dashboard-card admin-panel-card admin-lower-card">

            <div className="card-header admin-card-header">

              <div>
                <span className="admin-section-label">
                  BATTERY OPERATIONS
                </span>

                <h3>
                  Battery Tracking
                </h3>

                <p>
                  Repair-linked
                  battery activity.
                </p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate(
                    "/battery-tracking"
                  )
                }
              >
                View Tracking

                <ChevronRight
                  size={16}
                />
              </button>
            </div>

            <div className="admin-battery-dashboard">

              <div>
                <BatteryCharging
                  size={21}
                />

                <span>
                  Tracked
                </span>

                <strong>
                  {
                    data.batteryJobs
                  }
                </strong>
              </div>

              <div>
                <CheckCircle2
                  size={21}
                />

                <span>
                  Installed
                </span>

                <strong>
                  {
                    data.installedBatteries
                  }
                </strong>
              </div>

              <div>
                <Clock3
                  size={21}
                />

                <span>
                  Pending
                </span>

                <strong>
                  {
                    data.pendingBatteries
                  }
                </strong>
              </div>

              <div>
                <IndianRupee
                  size={21}
                />

                <span>
                  Est. Profit
                </span>

                <strong>
                  {formatCurrency(
                    data.batteryProfit
                  )}
                </strong>
              </div>
            </div>
          </section>

          {/* ALERTS */}

          <section className="dashboard-card admin-panel-card admin-lower-card">

            <div className="card-header admin-card-header">

              <div>
                <span className="admin-section-label">
                  SMART ATTENTION
                </span>

                <h3>
                  Priority Alerts
                </h3>

                <p>
                  Repairs requiring
                  owner attention.
                </p>
              </div>

              <div className="admin-alert-count">
                {data.urgent +
                  data.unassigned +
                  data.waitingApproval +
                  data.transferRequests}
              </div>
            </div>

            {data.urgent ===
              0 &&
            data.unassigned ===
              0 &&
            data.waitingApproval ===
              0 &&
            data.transferRequests ===
              0 ? (
              <div className="admin-no-alerts">

                <CheckCircle2
                  size={24}
                />

                <strong>
                  Everything looks
                  good
                </strong>

                <span>
                  No urgent owner
                  action required.
                </span>
              </div>
            ) : (
              <div className="admin-alert-list">

                {data.waitingApproval >
                  0 && (
                  <button>
                    <div className="admin-alert-icon">
                      <ShieldCheck
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        Customer
                        Approval
                      </strong>

                      <span>
                        {
                          data.waitingApproval
                        }{" "}
                        repair request
                        awaiting
                        decision
                      </span>
                    </div>

                    <ChevronRight
                      size={16}
                    />
                  </button>
                )}

                {data.transferRequests >
                  0 && (
                  <button>
                    <div className="admin-alert-icon">
                      <ArrowRightLeft
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        Transfer
                        Requests
                      </strong>

                      <span>
                        {
                          data.transferRequests
                        }{" "}
                        technician
                        transfer request
                      </span>
                    </div>

                    <ChevronRight
                      size={16}
                    />
                  </button>
                )}

                {data.unassigned >
                  0 && (
                  <button
                    onClick={() =>
                      navigate(
                        "/repair-jobs"
                      )
                    }
                  >
                    <div className="admin-alert-icon">
                      <Users
                        size={17}
                      />
                    </div>

                    <div>
                      <strong>
                        Unassigned
                        Repairs
                      </strong>

                      <span>
                        {
                          data.unassigned
                        }{" "}
                        repair jobs need
                        technician
                      </span>
                    </div>

                    <ChevronRight
                      size={16}
                    />
                  </button>
                )}

                {data.urgentJobs.map(
                  (job) => (
                    <button
                      key={
                        job.id
                      }
                      onClick={() =>
                        openRepairJob(
                          job.id
                        )
                      }
                    >
                      <div className="admin-alert-icon">

                        <AlertTriangle
                          size={17}
                        />
                      </div>

                      <div>
                        <strong>
                          {getDevice(
                            job
                          )}
                        </strong>

                        <span>
                          {job.id}
                          {" · "}
                          {getIssue(
                            job
                          )}
                        </span>
                      </div>

                      <ChevronRight
                        size={16}
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="admin-dashboard-footer">

          <div>
            <ShieldCheck
              size={17}
            />

            <strong>
              ANSAR TELECOM
            </strong>

            <span>
              Owner Operations
              System
            </span>
          </div>

          <span>
            Live business data
            synchronized with
            Firebase
          </span>
        </footer>
      </section>

      {/* =====================================================
          MONTHLY ATTENDANCE MODAL
      ===================================================== */}

      {attendanceModalOpen && (
        <div
          className="admin-attendance-overlay"
          onMouseDown={() =>
            setAttendanceModalOpen(
              false
            )
          }
        >
          <div
            className="admin-attendance-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="admin-attendance-modal-header">

              <div>
                <span className="admin-section-label">
                  OWNER ACCESS
                </span>

                <h2>
                  Monthly
                  Attendance
                </h2>

                <p>
                  Review technician
                  and receptionist
                  attendance.
                </p>
              </div>

              <button
                type="button"
                className="admin-attendance-close"
                onClick={() =>
                  setAttendanceModalOpen(
                    false
                  )
                }
              >
                <X
                  size={20}
                />
              </button>
            </div>

            {/* TOOLBAR */}

            <div className="admin-attendance-toolbar">

              <div className="admin-attendance-staff-select">

                <label>
                  Staff Member
                </label>

                <select
                  value={
                    selectedStaffId
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedStaffId(
                      event.target
                        .value
                    );

                    setSelectedAttendanceDate(
                      null
                    );
                  }}
                >
                  {staffMembers.map(
                    (member) => (
                      <option
                        key={
                          member.id
                        }
                        value={
                          member.id
                        }
                      >
                        {getStaffName(
                          member
                        )}

                        {" — "}

                        {normalizeText(
                          member.role
                        ) ===
                        "receptionist"
                          ? "Receptionist"
                          : "Technician"}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="admin-attendance-month-switcher">

                <button
                  type="button"
                  onClick={() =>
                    changeAttendanceMonth(
                      -1
                    )
                  }
                >
                  <ChevronLeft
                    size={18}
                  />
                </button>

                <strong>
                  {attendanceMonth.toLocaleDateString(
                    "en-IN",
                    {
                      month:
                        "long",

                      year:
                        "numeric",
                    }
                  )}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    changeAttendanceMonth(
                      1
                    )
                  }
                >
                  <ChevronRight
                    size={18}
                  />
                </button>
              </div>
            </div>

            {/* SUMMARY */}

            <div className="admin-attendance-summary">

              <div>
                <span>
                  Staff
                </span>

                <strong>
                  {selectedStaff
                    ? getStaffName(
                        selectedStaff
                      )
                    : "—"}
                </strong>
              </div>

              <div>
                <span>
                  Present Days
                </span>

                <strong>
                  {
                    monthlyAttendanceSummary.present
                  }
                </strong>
              </div>

              <div>
                <span>
                  Leave Records
                </span>

                <strong>
                  {
                    monthlyAttendanceSummary.leave
                  }
                </strong>
              </div>

              <div>
                <span>
                  Worked Time
                </span>

                <strong>
                  {formatSeconds(
                    monthlyAttendanceSummary.workedSeconds
                  )}
                </strong>
              </div>
            </div>

            {/* CALENDAR */}

            <div className="admin-attendance-calendar">

              <div className="admin-calendar-weekdays">

                <span>
                  Sun
                </span>

                <span>
                  Mon
                </span>

                <span>
                  Tue
                </span>

                <span>
                  Wed
                </span>

                <span>
                  Thu
                </span>

                <span>
                  Fri
                </span>

                <span>
                  Sat
                </span>
              </div>

              <div className="admin-calendar-grid">

                {attendanceCalendarDays.map(
                  (
                    day,
                    index
                  ) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="admin-calendar-day empty"
                        />
                      );
                    }

                    const record =
                      day.record;

                    const status =
                      record?.status ||
                      (
                        record?.clockIn
                          ? "Present"
                          : "No Record"
                      );

                    const isSelected =
                      selectedAttendanceDate ===
                      day.dateKey;

                    return (
                      <button
                        type="button"
                        key={
                          day.dateKey
                        }
                        className={`admin-calendar-day ${
                          record
                            ? "has-record"
                            : "no-record"
                        } ${
                          isSelected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedAttendanceDate(
                            day.dateKey
                          )
                        }
                      >
                        <strong>
                          {day.day}
                        </strong>

                        <span>
                          {status}
                        </span>

                        {record?.clockIn && (
                          <small>
                            {formatAttendanceTime(
                              record.clockIn
                            )}
                          </small>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* SELECTED DATE */}

            {selectedAttendanceDate && (
              <div className="admin-attendance-detail">

                <div className="admin-attendance-detail-header">

                  <div>
                    <span>
                      Selected Date
                    </span>

                    <strong>
                      {new Date(
                        `${selectedAttendanceDate}T00:00:00`
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          weekday:
                            "long",

                          day:
                            "2-digit",

                          month:
                            "long",

                          year:
                            "numeric",
                        }
                      )}
                    </strong>
                  </div>

                  <div className="admin-attendance-detail-status">
                    {selectedAttendanceRecord
                      ? selectedAttendanceRecord.status ||
                        "Present"
                      : "No Record"}
                  </div>
                </div>

                {selectedAttendanceRecord ? (
                  <div className="admin-attendance-detail-grid">

                    <div>
                      <LogIn
                        size={18}
                      />

                      <span>
                        Clock In
                      </span>

                      <strong>
                        {formatAttendanceTime(
                          selectedAttendanceRecord.clockIn
                        )}
                      </strong>
                    </div>

                    <div>
                      <Coffee
                        size={18}
                      />

                      <span>
                        Lunch Start
                      </span>

                      <strong>
                        {formatAttendanceTime(
                          selectedAttendanceRecord.lunchStart
                        )}
                      </strong>
                    </div>

                    <div>
                      <Coffee
                        size={18}
                      />

                      <span>
                        Lunch End
                      </span>

                      <strong>
                        {formatAttendanceTime(
                          selectedAttendanceRecord.lunchEnd
                        )}
                      </strong>
                    </div>

                    <div>
                      <LogOut
                        size={18}
                      />

                      <span>
                        Clock Out
                      </span>

                      <strong>
                        {formatAttendanceTime(
                          selectedAttendanceRecord.clockOut
                        )}
                      </strong>
                    </div>

                    <div>
                      <Clock3
                        size={18}
                      />

                      <span>
                        Worked
                      </span>

                      <strong>
                        {formatSeconds(
                          selectedAttendanceRecord.workedSeconds ||
                            0
                        )}
                      </strong>
                    </div>

                    <div>
                      <UserCheck
                        size={18}
                      />

                      <span>
                        Status
                      </span>

                      <strong>
                        {selectedAttendanceRecord.status ||
                          "Present"}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="admin-attendance-no-record">

                    <CalendarDays
                      size={22}
                    />

                    <strong>
                      No attendance
                      record
                    </strong>

                    <span>
                      No Clock In or
                      attendance data
                      exists for this
                      date.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;