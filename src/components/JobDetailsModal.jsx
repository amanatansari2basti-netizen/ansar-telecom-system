import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  BatteryCharging,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Edit3,
  History,
  IndianRupee,
  LockKeyhole,
  NotebookText,
  PackageCheck,
  Phone,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  TestTube2,
  User,
  UserRoundCog,
  Wrench,
  X,
} from "lucide-react";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import PatternLock from "./PatternLock";
import ThermalReceiptModal from "./ThermalReceiptModal";

import "../jobDetailsModal.css";

/* =========================================================
   V2 REPAIR STAGES
========================================================= */

const STAGES = {
  RECEIVED: "Device Received",
  DIAGNOSIS: "Diagnosis",
  WAITING_APPROVAL: "Waiting Customer Approval",
  APPROVED: "Approved",
  REPAIR: "Repair In Progress",
  WAITING_PART: "Waiting Part",
  TESTING: "Testing",
  READY: "Ready",
  DELIVERED: "Delivered",
  RETURNED: "Returned to Reception",
  RETURN_NO_REPAIR: "Returned Without Repair",
};

/* =========================================================
   HELPERS
========================================================= */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const formatMoney = (value) =>
  toNumber(value).toLocaleString("en-IN");

const formatDateTime = (value) => {
  if (!value) return "—";

  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
};

const getRepairStage = (job) => {
  if (job?.repairStage) return job.repairStage;

  switch (job?.status) {
    case "In Progress":
      return STAGES.REPAIR;

    case "Paused":
      return "Paused";

    case "Ready":
      return STAGES.READY;

    case "Completed":
      return STAGES.DELIVERED;

    case "Returned":
      return STAGES.RETURNED;

    default:
      return STAGES.RECEIVED;
  }
};

const getStatusClass = (status) => {
  if (
    status === "Completed" ||
    status === STAGES.DELIVERED
  ) {
    return "details-status completed";
  }

  if (
    status === "Ready" ||
    status === STAGES.READY
  ) {
    return "details-status ready";
  }

  if (
    status === "In Progress" ||
    status === STAGES.DIAGNOSIS ||
    status === STAGES.APPROVED ||
    status === STAGES.REPAIR ||
    status === STAGES.TESTING
  ) {
    return "details-status progress";
  }

  if (
    status === "Paused" ||
    status === STAGES.WAITING_APPROVAL ||
    status === STAGES.WAITING_PART
  ) {
    return "details-status paused";
  }

  if (
    status === "Returned" ||
    status === STAGES.RETURNED ||
    status === STAGES.RETURN_NO_REPAIR
  ) {
    return "details-status returned";
  }

  return "details-status pending";
};

const getPaymentClass = (payment) => {
  if (payment === "Paid") {
    return "details-payment paid";
  }

  if (
    payment === "Advance Paid" ||
    payment === "Partial"
  ) {
    return "details-payment advance";
  }

  return "details-payment pending";
};

const getPaymentStatus = (amount, advance) => {
  if (amount > 0 && advance >= amount) return "Paid";
  if (advance > 0) return "Advance Paid";
  return "Pending";
};

const getCustomerStatusForStage = (stage) => {
  switch (stage) {
    case STAGES.RECEIVED:
      return {
        text: "Your device has been received at Ansar Telecom.",
        code: "DEVICE_RECEIVED",
      };

    case STAGES.DIAGNOSIS:
      return {
        text: "Your device is currently being diagnosed.",
        code: "DIAGNOSIS",
      };

    case STAGES.WAITING_APPROVAL:
      return {
        text: "Diagnosis is complete. Your approval is required before repair.",
        code: "WAITING_APPROVAL",
      };

    case STAGES.APPROVED:
      return {
        text: "Repair has been approved and will proceed shortly.",
        code: "APPROVED",
      };

    case STAGES.REPAIR:
      return {
        text: "Repair work is currently in progress.",
        code: "REPAIR_IN_PROGRESS",
      };

    case STAGES.WAITING_PART:
      return {
        text: "Repair is temporarily waiting for a required part.",
        code: "WAITING_PART",
      };

    case STAGES.TESTING:
      return {
        text: "Repair is complete and your device is being tested.",
        code: "TESTING",
      };

    case STAGES.READY:
      return {
        text: "Your device is ready for collection.",
        code: "READY",
      };

    case STAGES.DELIVERED:
      return {
        text: "Your device has been delivered successfully.",
        code: "DELIVERED",
      };

    case STAGES.RETURNED:
      return {
        text: "Your device is currently at the reception desk.",
        code: "RETURNED_TO_RECEPTION",
      };

    case STAGES.RETURN_NO_REPAIR:
      return {
        text: "The device is being returned without repair.",
        code: "RETURNED_WITHOUT_REPAIR",
      };

    default:
      return {
        text: "Your repair is being processed.",
        code: "PROCESSING",
      };
  }
};

/* =========================================================
   COMPONENT
========================================================= */

const JobDetailsModal = ({
  job,
  isOpen,
  onClose,
  onUpdateJob,
}) => {
  const [technicians, setTechnicians] = useState([]);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [isTransferOpen, setIsTransferOpen] =
    useState(false);

  const [isReturnOpen, setIsReturnOpen] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [transferData, setTransferData] = useState({
    technicianId: "",
    reason: "",
  });

  const [returnData, setReturnData] = useState({
    type: "Same Issue",
    reason: "",
    notes: "",
  });

  const [editData, setEditData] = useState({
    priority: "Normal",
    amount: "",
    advance: "",
    notes: "",

    batteryStatus: "Required",
    batteryPayment: "Pending",
    batteryCustomerPrice: "",
    batteryCostPrice: "",
  });

  /* =======================================================
     TECHNICIANS
  ======================================================= */

  useEffect(() => {
    if (!isOpen) return undefined;

    const unsubscribe = onSnapshot(
      collection(db, "users"),

      (snapshot) => {
        const list = [];

        snapshot.forEach((document) => {
          const data = document.data();

          if (
            normalize(data.role) === "technician"
          ) {
            list.push({
              id: document.id,
              uid: document.id,
              ...data,
            });
          }
        });

        list.sort((a, b) =>
          String(a.name || a.fullName || "").localeCompare(
            String(b.name || b.fullName || "")
          )
        );

        setTechnicians(list);
      },

      (error) => {
        console.error(
          "Unable to load technicians:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  /* =======================================================
     RESET WHEN JOB CHANGES
  ======================================================= */

  useEffect(() => {
    if (!job) return;

    setEditData({
      priority: job.priority || "Normal",

      amount:
        job.estimate?.totalAmount ??
        job.amount ??
        job.estimatedCharge ??
        "",

      advance:
        job.receivedAmount ??
        job.paidAmount ??
        job.advance ??
        job.advanceReceived ??
        "",

      notes:
        job.notes ||
        job.internalNotes ||
        "",

      batteryStatus:
        job.battery?.status ||
        "Required",

      batteryPayment:
        job.battery?.payment ||
        "Pending",

      batteryCustomerPrice:
        job.battery?.customerPrice ??
        "",

      batteryCostPrice:
        job.battery?.costPrice ??
        "",
    });

    setTransferData({
      technicianId: "",
      reason: "",
    });

    setReturnData({
      type: "Same Issue",
      reason: "",
      notes: "",
    });

    setIsEditing(false);
    setIsTransferOpen(false);
    setIsReturnOpen(false);
    setActionError("");
  }, [job, isOpen]);

  /* =======================================================
     CURRENT TECHNICIAN
  ======================================================= */

  const getTechnicianName = (technician) =>
    technician?.name ||
    technician?.fullName ||
    technician?.technicianName ||
    "Technician";

  const currentTechnicianId =
    job?.technicianId ||
    job?.technicianUid ||
    job?.assignedTechnicianId ||
    job?.assignedToId ||
    "";

  const currentTechnicianName =
    job?.technician ||
    job?.technicianName ||
    job?.assignedTo ||
    job?.assignedTechnician ||
    "Unassigned";

  const availableTechnicians = useMemo(() => {
    return technicians.filter((technician) => {
      const name =
        getTechnicianName(technician);

      const sameId =
        currentTechnicianId &&
        String(technician.id) ===
          String(currentTechnicianId);

      const sameName =
        normalize(name) ===
        normalize(currentTechnicianName);

      if (sameId || sameName) return false;

      const status =
        normalize(technician.status || "Active");

      const availability =
        normalize(
          technician.availabilityStatus
        );

      return (
        status !== "inactive" &&
        status !== "on leave" &&
        availability !== "leave"
      );
    });
  }, [
    technicians,
    currentTechnicianId,
    currentTechnicianName,
  ]);

  if (!isOpen || !job) return null;

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const repairStage =
    getRepairStage(job);

  const amount = toNumber(
    job.estimate?.totalAmount ??
      job.amount ??
      job.estimatedCharge
  );

  const advance = toNumber(
    job.receivedAmount ??
      job.paidAmount ??
      job.advance ??
      job.advanceReceived
  );

  const balance =
    Math.max(amount - advance, 0);

  const payment =
    job.payment ||
    job.paymentStatus ||
    getPaymentStatus(amount, advance);

  const diagnosis =
    job.diagnosis || {};

  const estimate =
    job.estimate || {};

  const approval =
    job.customerApproval || {};

  const partRequirement =
    job.partRequirement || {};

  const testing =
    job.testing || {};

  const transferRequest =
    job.transferRequest || {};

  const transferPending =
    normalize(transferRequest.status) ===
    "pending";

  const stageHistory =
    Array.isArray(job.stageHistory)
      ? job.stageHistory
      : [];

  const jobHistory =
    Array.isArray(job.jobHistory)
      ? job.jobHistory
      : [];

  const transferHistory =
    Array.isArray(job.transferHistory)
      ? job.transferHistory
      : [];

  const returnHistory =
    Array.isArray(job.returnHistory)
      ? job.returnHistory
      : [];

  /* =======================================================
     GENERIC JOB UPDATE
  ======================================================= */

  const updateJob = async (data) => {
    const jobRef = doc(
      db,
      "repairJobs",
      job.id
    );

    await updateDoc(jobRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  /* =======================================================
     STAGE UPDATE
  ======================================================= */

  const changeStage = async ({
    stage,
    legacyStatus,
    extra = {},
    historyAction,
  }) => {
    const customer =
      getCustomerStatusForStage(stage);

    const historyItem = {
      stage,
      customerStatus: customer.text,
      source: "Owner",
      createdAt: new Date().toISOString(),
    };

    const activity = {
      action:
        historyAction ||
        `Stage changed to ${stage}`,

      previousStage:
        repairStage,

      stage,

      source: "Owner",

      actionAt:
        new Date().toISOString(),
    };

    await updateJob({
      repairStage: stage,

      status:
        legacyStatus ||
        job.status ||
        "Pending",

      customerStatus:
        customer.text,

      customerStatusCode:
        customer.code,

      stageHistory:
        arrayUnion(historyItem),

      jobHistory:
        arrayUnion(activity),

      ...extra,
    });
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setEditData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCancelEdit = () => {
    setEditData({
      priority:
        job.priority || "Normal",

      amount:
        job.estimate?.totalAmount ??
        job.amount ??
        job.estimatedCharge ??
        "",

      advance:
        job.receivedAmount ??
        job.paidAmount ??
        job.advance ??
        job.advanceReceived ??
        "",

      notes:
        job.notes ||
        job.internalNotes ||
        "",

      batteryStatus:
        job.battery?.status ||
        "Required",

      batteryPayment:
        job.battery?.payment ||
        "Pending",

      batteryCustomerPrice:
        job.battery?.customerPrice ??
        "",

      batteryCostPrice:
        job.battery?.costPrice ??
        "",
    });

    setIsEditing(false);
  };

  const handleSave = async () => {
    const updatedAmount =
      toNumber(editData.amount);

    const updatedAdvance =
      toNumber(editData.advance);

    if (
      updatedAdvance >
      updatedAmount &&
      updatedAmount > 0
    ) {
      setActionError(
        "Advance cannot be greater than the total repair amount."
      );
      return;
    }

    const newPayment =
      getPaymentStatus(
        updatedAmount,
        updatedAdvance
      );

    try {
      setActionLoading(true);
      setActionError("");

      const updatedJob = {
        ...job,

        priority:
          editData.priority,

        amount:
          updatedAmount,

        estimatedCharge:
          updatedAmount,

        advance:
          updatedAdvance,

        advanceReceived:
          updatedAdvance,

        receivedAmount:
          updatedAdvance,

        paidAmount:
          updatedAdvance,

        balanceAmount:
          Math.max(
            updatedAmount -
              updatedAdvance,
            0
          ),

        payment:
          newPayment,

        paymentStatus:
          newPayment ===
          "Advance Paid"
            ? "Partial"
            : newPayment,

        notes:
          editData.notes.trim(),

        internalNotes:
          editData.notes.trim(),

        estimate: {
          ...(job.estimate || {}),

          totalAmount:
            updatedAmount,

          status:
            updatedAmount > 0
              ? job.estimate?.status ===
                "Approved"
                ? "Approved"
                : "Prepared"
              : "Not Prepared",
        },

        battery:
          job.batteryUsed &&
          job.battery
            ? {
                ...job.battery,

                status:
                  editData.batteryStatus,

                payment:
                  editData.batteryPayment,

                customerPrice:
                  toNumber(
                    editData.batteryCustomerPrice
                  ),

                costPrice:
                  toNumber(
                    editData.batteryCostPrice
                  ),
              }
            : job.battery,
      };

      await onUpdateJob?.(
        updatedJob
      );

      setIsEditing(false);
    } catch (error) {
      console.error(error);

      setActionError(
        "Unable to save job changes."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =======================================================
     OWNER LIFECYCLE ACTIONS
  ======================================================= */

  const runLifecycleAction =
    async (callback) => {
      try {
        setActionLoading(true);
        setActionError("");

        await callback();
      } catch (error) {
        console.error(
          "Lifecycle action error:",
          error
        );

        setActionError(
          "Unable to update repair workflow."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const startDiagnosis = () =>
    runLifecycleAction(async () => {
      await changeStage({
        stage: STAGES.DIAGNOSIS,

        legacyStatus:
          "In Progress",

        historyAction:
          "Diagnosis Started",

        extra: {
          "diagnosis.status":
            "In Progress",

          "diagnosis.startedAt":
            serverTimestamp(),

          startedAt:
            job.startedAt ||
            serverTimestamp(),

          pausedAt: null,
          pauseReason: "",
        },
      });
    });

  const prepareEstimate = () =>
    runLifecycleAction(async () => {
      const diagnosisSummary =
        window.prompt(
          "Diagnosis summary:",
          diagnosis.summary || ""
        );

      if (diagnosisSummary === null) {
        return;
      }

      const partsInput =
        window.prompt(
          "Parts amount:",
          String(
            estimate.partsAmount ||
              0
          )
        );

      if (partsInput === null) {
        return;
      }

      const labourInput =
        window.prompt(
          "Labour amount:",
          String(
            estimate.labourAmount ||
              0
          )
        );

      if (labourInput === null) {
        return;
      }

      const parts =
        Math.max(
          toNumber(partsInput),
          0
        );

      const labour =
        Math.max(
          toNumber(labourInput),
          0
        );

      const total =
        parts + labour;

      const now =
        new Date().toISOString();

      await changeStage({
        stage:
          STAGES.WAITING_APPROVAL,

        legacyStatus:
          "Paused",

        historyAction:
          "Estimate Prepared",

        extra: {
          "diagnosis.status":
            "Completed",

          "diagnosis.summary":
            diagnosisSummary.trim(),

          "diagnosis.completedAt":
            serverTimestamp(),

          "estimate.status":
            "Prepared",

          "estimate.partsAmount":
            parts,

          "estimate.labourAmount":
            labour,

          "estimate.totalAmount":
            total,

          "estimate.preparedAt":
            serverTimestamp(),

          amount: total,
          estimatedCharge: total,

          "customerApproval.status":
            "Pending",

          "customerApproval.requestedAt":
            serverTimestamp(),

          pausedAt:
            serverTimestamp(),

          stageBeforePause:
            STAGES.WAITING_APPROVAL,

          pauseReason:
            "Waiting Customer Approval",

          stageHistory:
            arrayUnion({
              stage:
                STAGES.WAITING_APPROVAL,

              customerStatus:
                "Diagnosis is complete. Your approval is required before repair.",

              source: "Owner",

              createdAt: now,
            }),
        },
      });
    });

  const approveRepair = () =>
    runLifecycleAction(async () => {
      await changeStage({
        stage: STAGES.APPROVED,

        legacyStatus:
          "Paused",

        historyAction:
          "Customer Approval Recorded",

        extra: {
          "customerApproval.status":
            "Approved",

          "customerApproval.respondedAt":
            serverTimestamp(),

          "customerApproval.approvedAt":
            serverTimestamp(),

          "customerApproval.rejectedAt":
            null,

          "customerApproval.source":
            "Owner / Shop",

          stageBeforePause:
            STAGES.APPROVED,

          pauseReason:
            "Approved - waiting for technician to resume",
        },
      });
    });

  const rejectRepair = () =>
    runLifecycleAction(async () => {
      const reason =
        window.prompt(
          "Customer rejection / cancellation reason:"
        );

      if (
        reason === null ||
        !reason.trim()
      ) {
        return;
      }

      await updateJob({
        status: "Paused",

        repairStage:
          STAGES.WAITING_APPROVAL,

        customerStatus:
          "Repair has not been approved. Please contact Ansar Telecom for assistance.",

        customerStatusCode:
          "REPAIR_NOT_APPROVED",

        "customerApproval.status":
          "Rejected",

        "customerApproval.respondedAt":
          serverTimestamp(),

        "customerApproval.rejectedAt":
          serverTimestamp(),

        "customerApproval.source":
          "Owner / Shop",

        "customerApproval.notes":
          reason.trim(),

        pauseReason:
          "Customer rejected repair",

        pausedAt:
          job.pausedAt ||
          serverTimestamp(),

        jobHistory:
          arrayUnion({
            action:
              "Repair Approval Rejected",

            reason:
              reason.trim(),

            source: "Owner",

            actionAt:
              new Date().toISOString(),
          }),
      });
    });

  const startRepair = () =>
    runLifecycleAction(async () => {
      await changeStage({
        stage: STAGES.REPAIR,

        legacyStatus:
          "In Progress",

        historyAction:
          "Repair Started",

        extra: {
          pausedAt: null,
          pauseReason: "",
          stageBeforePause: "",
        },
      });
    });

  const waitingPart = () =>
    runLifecycleAction(async () => {
      const partName =
        window.prompt(
          "Which part is required?",
          partRequirement.partName ||
            ""
        );

      if (
        partName === null ||
        !partName.trim()
      ) {
        return;
      }

      const notes =
        window.prompt(
          "Part notes (optional):",
          partRequirement.notes ||
            ""
        );

      if (notes === null) return;

      await changeStage({
        stage:
          STAGES.WAITING_PART,

        legacyStatus:
          "Paused",

        historyAction:
          "Waiting for Part",

        extra: {
          "partRequirement.status":
            "Required",

          "partRequirement.partName":
            partName.trim(),

          "partRequirement.notes":
            notes.trim(),

          "partRequirement.requestedAt":
            serverTimestamp(),

          pausedAt:
            serverTimestamp(),

          stageBeforePause:
            STAGES.WAITING_PART,

          pauseReason:
            `Waiting Part: ${partName.trim()}`,
        },
      });
    });

  const partReceived = () =>
    runLifecycleAction(async () => {
      await changeStage({
        stage: STAGES.REPAIR,

        legacyStatus:
          "Paused",

        historyAction:
          "Required Part Received",

        extra: {
          "partRequirement.status":
            "Received",

          "partRequirement.receivedAt":
            serverTimestamp(),

          stageBeforePause:
            STAGES.REPAIR,

          pauseReason:
            "Part received - waiting for technician to resume",
        },
      });
    });

  const startTesting = () =>
    runLifecycleAction(async () => {
      await changeStage({
        stage: STAGES.TESTING,

        legacyStatus:
          "In Progress",

        historyAction:
          "Device Testing Started",

        extra: {
          "testing.status":
            "In Progress",

          "testing.startedAt":
            serverTimestamp(),

          pausedAt: null,
          pauseReason: "",
        },
      });
    });

  const markReady = () =>
    runLifecycleAction(async () => {
      await changeStage({
        stage: STAGES.READY,

        legacyStatus:
          "Ready",

        historyAction:
          "Device Ready",

        extra: {
          "testing.status":
            "Completed",

          "testing.completedAt":
            serverTimestamp(),

          "delivery.status":
            "Ready",

          "delivery.readyAt":
            serverTimestamp(),

          completedAt:
            serverTimestamp(),

          pausedAt: null,
          pauseReason: "",
        },
      });
    });

  /* =======================================================
     SAFE OWNER TRANSFER

     IMPORTANT:
     Active repair -> Paused handoff.
     Timer/lifecycle is NOT reset.

     Pending job -> stays Pending.

     Already Paused -> remains Paused.
  ======================================================= */

  const handleTransferJob =
    async () => {
      if (
        !transferData.technicianId
      ) {
        setActionError(
          "Please select the technician."
        );
        return;
      }

      const newTechnician =
        technicians.find(
          (technician) =>
            String(
              technician.id
            ) ===
            String(
              transferData.technicianId
            )
        );

      if (!newTechnician) {
        setActionError(
          "Selected technician was not found."
        );
        return;
      }

      const reason =
        transferData.reason.trim();

      if (!reason) {
        setActionError(
          "Please enter the transfer reason."
        );
        return;
      }

      const newName =
        getTechnicianName(
          newTechnician
        );

      try {
        setActionLoading(true);
        setActionError("");

        let nextStatus =
          job.status || "Pending";

        let nextPausedAt =
          job.pausedAt || null;

        let nextPauseReason =
          job.pauseReason || "";

        let nextStageBeforePause =
          job.stageBeforePause ||
          repairStage;

        /*
         * If technician was actively working,
         * freeze timer during handoff.
         */
        if (
          job.status ===
          "In Progress"
        ) {
          nextStatus = "Paused";

          nextPausedAt =
            serverTimestamp();

          nextPauseReason =
            "Transferred - waiting for technician to resume";

          nextStageBeforePause =
            repairStage;
        }

        const historyItem = {
          fromTechnicianId:
            currentTechnicianId ||
            "",

          fromTechnician:
            currentTechnicianName,

          toTechnicianId:
            newTechnician.id,

          toTechnician:
            newName,

          reason,

          previousStatus:
            job.status ||
            "Pending",

          previousRepairStage:
            repairStage,

          transferredAt:
            new Date().toISOString(),

          source: "Owner",
        };

        await updateJob({
          technician:
            newName,

          technicianName:
            newName,

          technicianId:
            newTechnician.id,

          technicianUid:
            newTechnician.id,

          assignedTechnicianId:
            newTechnician.id,

          assignedToId:
            newTechnician.id,

          assignedTo:
            newName,

          assignedTechnician:
            newName,

          assignedAt:
            serverTimestamp(),

          lastAssignedAt:
            serverTimestamp(),

          assignmentAlertTrigger:
            Date.now(),

          transferredAt:
            serverTimestamp(),

          lastTransferReason:
            reason,

          status:
            nextStatus,

          /*
           * repairStage is preserved.
           */
          repairStage,

          pausedAt:
            nextPausedAt,

          pauseReason:
            nextPauseReason,

          stageBeforePause:
            nextStageBeforePause,

          transferHistory:
            arrayUnion(
              historyItem
            ),

          jobHistory:
            arrayUnion({
              action:
                "Transfer Approved",

              fromTechnicianId:
                currentTechnicianId ||
                "",

              fromTechnicianName:
                currentTechnicianName,

              targetTechnicianId:
                newTechnician.id,

              targetTechnicianName:
                newName,

              reason,

              previousStatus:
                job.status,

              previousRepairStage:
                repairStage,

              source: "Owner",

              actionAt:
                new Date().toISOString(),
            }),

          /*
           * Any old technician request is
           * resolved by Owner's transfer.
           */
          "transferRequest.status":
            transferPending
              ? "approved"
              : "",

          "transferRequest.decidedByName":
            transferPending
              ? "Owner"
              : "",

          "transferRequest.decidedAt":
            transferPending
              ? serverTimestamp()
              : null,

          "transferRequest.decisionSource":
            transferPending
              ? "Owner"
              : "",
        });

        setTransferData({
          technicianId: "",
          reason: "",
        });

        setIsTransferOpen(false);
      } catch (error) {
        console.error(
          "Transfer job error:",
          error
        );

        setActionError(
          "Unable to transfer this job."
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     APPROVE PENDING TECHNICIAN TRANSFER REQUEST
  ======================================================= */

  const approveTransferRequest =
    async () => {
      const targetId =
        transferRequest.targetTechnicianId ||
        transferRequest.targetTechnicianUid ||
        "";

      const target =
        technicians.find(
          (technician) =>
            String(
              technician.id
            ) ===
            String(targetId)
        );

      if (!target) {
        setActionError(
          "Requested technician was not found."
        );
        return;
      }

      const targetName =
        getTechnicianName(target);

      try {
        setActionLoading(true);
        setActionError("");

        let nextStatus =
          job.status || "Pending";

        let nextPausedAt =
          job.pausedAt || null;

        let nextPauseReason =
          job.pauseReason || "";

        if (
          job.status ===
          "In Progress"
        ) {
          nextStatus = "Paused";

          nextPausedAt =
            serverTimestamp();

          nextPauseReason =
            "Transferred - waiting for technician to resume";
        }

        await updateJob({
          technician:
            targetName,

          technicianName:
            targetName,

          technicianId:
            target.id,

          technicianUid:
            target.id,

          assignedTechnicianId:
            target.id,

          assignedToId:
            target.id,

          assignedTo:
            targetName,

          assignedTechnician:
            targetName,

          assignedAt:
            serverTimestamp(),

          lastAssignedAt:
            serverTimestamp(),

          assignmentAlertTrigger:
            Date.now(),

          transferredAt:
            serverTimestamp(),

          status:
            nextStatus,

          repairStage,

          pausedAt:
            nextPausedAt,

          pauseReason:
            nextPauseReason,

          stageBeforePause:
            repairStage,

          lastTransferReason:
            transferRequest.reason ||
            "",

          "transferRequest.status":
            "approved",

          "transferRequest.decidedByName":
            "Owner",

          "transferRequest.decidedAt":
            serverTimestamp(),

          "transferRequest.decisionSource":
            "Owner",

          transferHistory:
            arrayUnion({
              fromTechnicianId:
                currentTechnicianId ||
                "",

              fromTechnician:
                currentTechnicianName,

              toTechnicianId:
                target.id,

              toTechnician:
                targetName,

              reason:
                transferRequest.reason ||
                "",

              transferredAt:
                new Date().toISOString(),

              source:
                "Technician Request / Owner Approval",
            }),

          jobHistory:
            arrayUnion({
              action:
                "Transfer Approved",

              requestedByName:
                transferRequest.requestedByName ||
                currentTechnicianName,

              fromTechnicianName:
                currentTechnicianName,

              targetTechnicianId:
                target.id,

              targetTechnicianName:
                targetName,

              reason:
                transferRequest.reason ||
                "",

              previousRepairStage:
                repairStage,

              source: "Owner",

              actionAt:
                new Date().toISOString(),
            }),
        });
      } catch (error) {
        console.error(error);

        setActionError(
          "Unable to approve transfer request."
        );
      } finally {
        setActionLoading(false);
      }
    };

  const rejectTransferRequest =
    async () => {
      const reason =
        window.prompt(
          "Reason for rejecting transfer request (optional):"
        );

      if (reason === null) {
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        await updateJob({
          "transferRequest.status":
            "rejected",

          "transferRequest.decidedByName":
            "Owner",

          "transferRequest.decidedAt":
            serverTimestamp(),

          "transferRequest.decisionSource":
            "Owner",

          "transferRequest.decisionNotes":
            reason.trim(),

          jobHistory:
            arrayUnion({
              action:
                "Transfer Rejected",

              requestedByName:
                transferRequest.requestedByName ||
                currentTechnicianName,

              targetTechnicianName:
                transferRequest.targetTechnicianName ||
                "",

              reason:
                transferRequest.reason ||
                "",

              decisionNotes:
                reason.trim(),

              source: "Owner",

              actionAt:
                new Date().toISOString(),
            }),
        });
      } catch (error) {
        console.error(error);

        setActionError(
          "Unable to reject transfer request."
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     RETURN JOB
  ======================================================= */

  const handleReturnJob =
    async () => {
      const reason =
        returnData.reason.trim();

      if (!reason) {
        setActionError(
          "Please enter why the device was returned."
        );
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        const returnEntry = {
          type:
            returnData.type,

          reason,

          notes:
            returnData.notes.trim(),

          previousStatus:
            job.status ||
            "Completed",

          previousRepairStage:
            repairStage,

          technicianId:
            currentTechnicianId ||
            "",

          technician:
            currentTechnicianName,

          returnedAt:
            new Date().toISOString(),
        };

        const customer =
          getCustomerStatusForStage(
            STAGES.RETURNED
          );

        await updateJob({
          status: "Returned",

          repairStage:
            STAGES.RETURNED,

          customerStatus:
            customer.text,

          customerStatusCode:
            customer.code,

          isReturned: true,

          returnCount:
            toNumber(
              job.returnCount
            ) + 1,

          returnType:
            returnData.type,

          returnReason:
            reason,

          returnNotes:
            returnData.notes.trim(),

          returnedAt:
            serverTimestamp(),

          returnHistory:
            arrayUnion(
              returnEntry
            ),

          stageHistory:
            arrayUnion({
              stage:
                STAGES.RETURNED,

              customerStatus:
                customer.text,

              source: "Owner",

              createdAt:
                new Date().toISOString(),
            }),

          jobHistory:
            arrayUnion({
              action:
                "Repair Returned",

              reason,

              returnType:
                returnData.type,

              previousRepairStage:
                repairStage,

              source: "Owner",

              actionAt:
                new Date().toISOString(),
            }),

          completedAt: null,
          startedAt: null,
          pausedAt: null,
          pauseReason: "",
        });

        setReturnData({
          type: "Same Issue",
          reason: "",
          notes: "",
        });

        setIsReturnOpen(false);
      } catch (error) {
        console.error(
          "Return job error:",
          error
        );

        setActionError(
          "Unable to mark this job as returned."
        );
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="details-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="details-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* ================= HEADER ================= */}

        <div className="details-modal-header">
          <div>
            <span className="details-modal-eyebrow">
              Repair Job Details
            </span>

            <div className="details-title-row">
              <h2>{job.id}</h2>

              <span
                className={getStatusClass(
                  repairStage
                )}
              >
                {repairStage}
              </span>

              {job.isReturned && (
                <span className="details-return-count">
                  <RotateCcw size={12} />
                  Returned{" "}
                  {job.returnCount || 1}x
                </span>
              )}
            </div>

            <p>
              Complete repair lifecycle,
              customer, technician and
              payment information.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              title="Print Thermal Receipt (80mm / 58mm)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 13px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1e293b",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <Printer size={15} />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              className="details-close-button"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="details-modal-content">

          {/* ================= ERROR ================= */}

          {actionError && (
            <div className="details-action-error">
              <AlertCircle
                size={15}
                style={{
                  marginRight: 7,
                  verticalAlign: "middle",
                }}
              />

              {actionError}
            </div>
          )}

          {/* ================= CUSTOMER STATUS ================= */}

          <section className="details-section">
            <div className="details-section-heading">
              <div className="details-section-icon green">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h3>
                  Customer Tracking Status
                </h3>

                <p>
                  Safe information that can
                  later be shown on Track
                  Your Phone.
                </p>
              </div>
            </div>

            <div className="details-problem-box">
              <span>
                Current Repair Stage
              </span>

              <strong>
                {repairStage}
              </strong>
            </div>

            <div
              className="details-notes-box"
              style={{
                marginTop: 10,
              }}
            >
              <ShieldCheck size={16} />

              <p>
                {job.customerStatus ||
                  getCustomerStatusForStage(
                    repairStage
                  ).text}
              </p>
            </div>
          </section>

          {/* ================= CUSTOMER + DEVICE ================= */}

          <div className="details-main-grid">
            <section className="details-section">
              <div className="details-section-heading">
                <div className="details-section-icon blue">
                  <User size={18} />
                </div>

                <div>
                  <h3>Customer Details</h3>
                  <p>
                    Customer contact
                    information
                  </p>
                </div>
              </div>

              <div className="details-info-list">
                <div className="details-info-row">
                  <span>
                    <User size={14} />
                    Customer Name
                  </span>

                  <strong>
                    {job.customer ||
                      job.customerName ||
                      "—"}
                  </strong>
                </div>

                <div className="details-info-row">
                  <span>
                    <Phone size={14} />
                    Mobile Number
                  </span>

                  <strong>
                    {job.phone ||
                      job.mobileNumber ||
                      job.customerPhone ||
                      "—"}
                  </strong>
                </div>

                <div className="details-info-row">
                  <span>
                    <CalendarDays size={14} />
                    Received
                  </span>

                  <strong>
                    {job.received ||
                      formatDateTime(
                        job.createdAt
                      )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="details-section">
              <div className="details-section-heading">
                <div className="details-section-icon purple">
                  <Smartphone size={18} />
                </div>

                <div>
                  <h3>Device Details</h3>

                  <p>
                    Device received for
                    repair
                  </p>
                </div>
              </div>

              <div className="details-info-list">
                <div className="details-info-row">
                  <span>
                    <Smartphone size={14} />
                    Device
                  </span>

                  <strong>
                    {job.device ||
                      job.deviceModel ||
                      `${job.brand || ""} ${
                        job.model || ""
                      }`.trim() ||
                      "—"}
                  </strong>
                </div>

                <div className="details-info-row">
                  <span>
                    IMEI / Serial
                  </span>

                  <strong>
                    {job.imei ||
                      job.serialNumber ||
                      "Not Added"}
                  </strong>
                </div>

                {/* SCREEN LOCK / PASSWORD / PATTERN */}
                {((job.lockType === "pattern") || (Array.isArray(job.devicePattern) && job.devicePattern.length > 0)) ? (
                  <div className="details-info-row" style={{ alignItems: "flex-start", paddingTop: "6px" }}>
                    <span>
                      <LockKeyhole size={14} style={{ color: "#2563eb" }} />
                      Pattern Lock
                    </span>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <PatternLock value={job.devicePattern} readOnly={true} size={145} />
                    </div>
                  </div>
                ) : (job.lockType === "pin" || job.devicePassword) ? (
                  <div className="details-info-row">
                    <span>
                      <LockKeyhole size={14} style={{ color: "#2563eb" }} />
                      PIN / Password
                    </span>

                    <strong style={{ color: "#1e293b", fontSize: "14px", letterSpacing: "0.05em" }}>
                      {job.devicePassword}
                    </strong>
                  </div>
                ) : (
                  <div className="details-info-row">
                    <span>
                      <LockKeyhole size={14} />
                      Screen Lock
                    </span>

                    <strong>
                      {job.lockCode || "No Lock (खुला है)"}
                    </strong>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ================= REPAIR INFO ================= */}

          <section className="details-section">
            <div className="details-section-heading">
              <div className="details-section-icon orange">
                <Wrench size={18} />
              </div>

              <div>
                <h3>Repair Information</h3>

                <p>
                  Complaint, technician and
                  internal repair state
                </p>
              </div>
            </div>

            <div className="details-problem-box">
              <span>
                Reported Problem
              </span>

              <strong>
                {job.issue ||
                  job.reportedProblem ||
                  job.problem ||
                  "No problem added"}
              </strong>
            </div>

            <div className="details-repair-grid">
              <div>
                <span>Technician</span>
                <strong>
                  {currentTechnicianName}
                </strong>
              </div>

              <div>
                <span>Repair Stage</span>
                <strong>
                  {repairStage}
                </strong>
              </div>

              <div>
                <span>
                  System Status
                </span>
                <strong>
                  {job.status ||
                    "Pending"}
                </strong>
              </div>

              <div>
                <span>Priority</span>
                <strong>
                  {job.priority ||
                    "Normal"}
                </strong>
              </div>
            </div>
          </section>

          {/* ================= V2 WORKFLOW ================= */}

          <section className="details-section">
            <div className="details-section-heading">
              <div className="details-section-icon blue">
                <Activity size={18} />
              </div>

              <div>
                <h3>
                  Repair Workflow
                </h3>

                <p>
                  Owner lifecycle controls
                </p>
              </div>
            </div>

            <div className="details-repair-grid">
              <div>
                <span>Diagnosis</span>
                <strong>
                  {diagnosis.status ||
                    "Not Started"}
                </strong>
              </div>

              <div>
                <span>
                  Customer Approval
                </span>
                <strong>
                  {approval.status ||
                    "Not Required Yet"}
                </strong>
              </div>

              <div>
                <span>Part</span>
                <strong>
                  {partRequirement.status ||
                    "Not Required"}
                </strong>
              </div>

              <div>
                <span>Testing</span>
                <strong>
                  {testing.status ||
                    "Not Started"}
                </strong>
              </div>
            </div>

            {diagnosis.summary && (
              <div
                className="details-problem-box"
                style={{
                  marginTop: 12,
                }}
              >
                <span>
                  Diagnosis Summary
                </span>

                <strong>
                  {diagnosis.summary}
                </strong>
              </div>
            )}

            {partRequirement.partName && (
              <div
                className="details-problem-box"
                style={{
                  marginTop: 12,
                }}
              >
                <span>
                  Required Part
                </span>

                <strong>
                  {partRequirement.partName}
                </strong>
              </div>
            )}

            <div
              className="details-job-actions"
              style={{
                flexWrap: "wrap",
                marginTop: 16,
              }}
            >
              {repairStage ===
                STAGES.RECEIVED && (
                <button
                  type="button"
                  className="details-transfer-button"
                  disabled={actionLoading}
                  onClick={startDiagnosis}
                >
                  <Wrench size={16} />
                  Start Diagnosis
                </button>
              )}

              {repairStage ===
                STAGES.DIAGNOSIS && (
                <button
                  type="button"
                  className="details-transfer-button"
                  disabled={actionLoading}
                  onClick={prepareEstimate}
                >
                  <IndianRupee size={16} />
                  Prepare Estimate
                </button>
              )}

              {repairStage ===
                STAGES.WAITING_APPROVAL && (
                <>
                  <button
                    type="button"
                    className="details-transfer-button"
                    disabled={actionLoading}
                    onClick={approveRepair}
                  >
                    <CheckCircle2 size={16} />
                    Approve Repair
                  </button>

                  <button
                    type="button"
                    className="details-return-button"
                    disabled={actionLoading}
                    onClick={rejectRepair}
                  >
                    <X size={16} />
                    Reject Repair
                  </button>
                </>
              )}

              {repairStage ===
                STAGES.APPROVED && (
                <button
                  type="button"
                  className="details-transfer-button"
                  disabled={actionLoading}
                  onClick={startRepair}
                >
                  <Wrench size={16} />
                  Start Repair
                </button>
              )}

              {repairStage ===
                STAGES.REPAIR && (
                <>
                  <button
                    type="button"
                    className="details-transfer-button"
                    disabled={actionLoading}
                    onClick={waitingPart}
                  >
                    <Wrench size={16} />
                    Waiting Part
                  </button>

                  <button
                    type="button"
                    className="details-transfer-button"
                    disabled={actionLoading}
                    onClick={startTesting}
                  >
                    <TestTube2 size={16} />
                    Start Testing
                  </button>
                </>
              )}

              {repairStage ===
                STAGES.WAITING_PART && (
                <button
                  type="button"
                  className="details-transfer-button"
                  disabled={actionLoading}
                  onClick={partReceived}
                >
                  <PackageCheck size={16} />
                  Part Received
                </button>
              )}

              {repairStage ===
                STAGES.TESTING && (
                <button
                  type="button"
                  className="details-transfer-button"
                  disabled={actionLoading}
                  onClick={markReady}
                >
                  <CheckCircle2 size={16} />
                  Mark Ready
                </button>
              )}
            </div>
          </section>

          {/* ================= TRANSFER REQUEST ================= */}

          {transferPending && (
            <section className="details-section">
              <div className="details-section-heading">
                <div className="details-section-icon orange">
                  <ArrowRightLeft size={18} />
                </div>

                <div>
                  <h3>
                    Pending Transfer Request
                  </h3>

                  <p>
                    Technician requested
                    approval to hand over
                    this repair.
                  </p>
                </div>
              </div>

              <div className="details-repair-grid">
                <div>
                  <span>Requested By</span>
                  <strong>
                    {transferRequest.requestedByName ||
                      currentTechnicianName}
                  </strong>
                </div>

                <div>
                  <span>Transfer To</span>
                  <strong>
                    {transferRequest.targetTechnicianName ||
                      "Technician"}
                  </strong>
                </div>

                <div>
                  <span>Reason</span>
                  <strong>
                    {transferRequest.reason ||
                      "No reason"}
                  </strong>
                </div>

                <div>
                  <span>Stage</span>
                  <strong>
                    {transferRequest.previousRepairStage ||
                      repairStage}
                  </strong>
                </div>
              </div>

              <div
                className="details-action-buttons"
                style={{
                  marginTop: 14,
                }}
              >
                <button
                  type="button"
                  className="details-action-cancel"
                  disabled={actionLoading}
                  onClick={
                    rejectTransferRequest
                  }
                >
                  Reject
                </button>

                <button
                  type="button"
                  className="details-action-confirm transfer"
                  disabled={actionLoading}
                  onClick={
                    approveTransferRequest
                  }
                >
                  <CheckCircle2 size={15} />

                  {actionLoading
                    ? "Saving..."
                    : "Approve Transfer"}
                </button>
              </div>
            </section>
          )}

          {/* ================= MANUAL ACTIONS ================= */}

          {!isEditing && (
            <section className="details-section">
              <div className="details-section-heading">
                <div className="details-section-icon slate">
                  <UserRoundCog size={18} />
                </div>

                <div>
                  <h3>Owner Actions</h3>
                  <p>
                    Manual technician
                    transfer or returned
                    repair
                  </p>
                </div>
              </div>

              <div className="details-job-actions">
                <button
                  type="button"
                  className="details-transfer-button"
                  onClick={() => {
                    setActionError("");
                    setIsReturnOpen(false);

                    setIsTransferOpen(
                      (previous) =>
                        !previous
                    );
                  }}
                >
                  <ArrowRightLeft size={16} />
                  Transfer Technician
                </button>

                <button
                  type="button"
                  className="details-return-button"
                  onClick={() => {
                    setActionError("");
                    setIsTransferOpen(false);

                    setIsReturnOpen(
                      (previous) =>
                        !previous
                    );
                  }}
                >
                  <RotateCcw size={16} />
                  Return Job
                </button>
              </div>
            </section>
          )}

          {/* ================= TRANSFER PANEL ================= */}

          {isTransferOpen && (
            <section className="details-section">
              <div className="details-action-panel transfer">
                <div className="details-action-panel-heading">
                  <div>
                    <UserRoundCog size={18} />
                  </div>

                  <div>
                    <strong>
                      Transfer Job
                    </strong>

                    <span>
                      Transfer without
                      resetting repair
                      lifecycle or timer.
                    </span>
                  </div>
                </div>

                <div className="details-action-current">
                  <span>
                    Current Technician
                  </span>

                  <strong>
                    {currentTechnicianName}
                  </strong>
                </div>

                <div className="details-edit-grid payment">
                  <div className="details-edit-field">
                    <label>
                      Transfer To
                    </label>

                    <select
                      value={
                        transferData.technicianId
                      }
                      onChange={(event) =>
                        setTransferData(
                          (previous) => ({
                            ...previous,

                            technicianId:
                              event.target
                                .value,
                          })
                        )
                      }
                    >
                      <option value="">
                        Select Technician
                      </option>

                      {availableTechnicians.map(
                        (technician) => (
                          <option
                            key={
                              technician.id
                            }
                            value={
                              technician.id
                            }
                          >
                            {getTechnicianName(
                              technician
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="details-edit-field">
                    <label>
                      Transfer Reason
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Hardware specialist required"
                      value={
                        transferData.reason
                      }
                      onChange={(event) =>
                        setTransferData(
                          (previous) => ({
                            ...previous,

                            reason:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </div>
                </div>

                <div className="details-action-buttons">
                  <button
                    type="button"
                    className="details-action-cancel"
                    onClick={() =>
                      setIsTransferOpen(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="details-action-confirm transfer"
                    disabled={actionLoading}
                    onClick={
                      handleTransferJob
                    }
                  >
                    <ArrowRightLeft size={15} />

                    {actionLoading
                      ? "Transferring..."
                      : "Confirm Transfer"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ================= RETURN PANEL ================= */}

          {isReturnOpen && (
            <section className="details-section">
              <div className="details-action-panel returned">
                <div className="details-action-panel-heading">
                  <div>
                    <RotateCcw size={18} />
                  </div>

                  <div>
                    <strong>
                      Return Repair
                    </strong>

                    <span>
                      Record a device
                      returned by the
                      customer.
                    </span>
                  </div>
                </div>

                <div className="details-edit-grid payment">
                  <div className="details-edit-field">
                    <label>
                      Return Type
                    </label>

                    <select
                      value={
                        returnData.type
                      }
                      onChange={(event) =>
                        setReturnData(
                          (previous) => ({
                            ...previous,

                            type:
                              event.target
                                .value,
                          })
                        )
                      }
                    >
                      <option>
                        Same Issue
                      </option>

                      <option>
                        Repeat Problem
                      </option>

                      <option>
                        New Issue
                      </option>

                      <option>
                        Warranty Return
                      </option>

                      <option>
                        Customer Complaint
                      </option>

                      <option>
                        Other
                      </option>
                    </select>
                  </div>

                  <div className="details-edit-field">
                    <label>
                      Return Reason
                    </label>

                    <input
                      type="text"
                      placeholder="Why was the device returned?"
                      value={
                        returnData.reason
                      }
                      onChange={(event) =>
                        setReturnData(
                          (previous) => ({
                            ...previous,

                            reason:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </div>
                </div>

                <div className="details-edit-field full details-return-notes">
                  <label>
                    Additional Notes
                  </label>

                  <textarea
                    rows={3}
                    placeholder="Optional return notes..."
                    value={
                      returnData.notes
                    }
                    onChange={(event) =>
                      setReturnData(
                        (previous) => ({
                          ...previous,

                          notes:
                            event.target
                              .value,
                        })
                      )
                    }
                  />
                </div>

                <div className="details-action-buttons">
                  <button
                    type="button"
                    className="details-action-cancel"
                    onClick={() =>
                      setIsReturnOpen(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="details-action-confirm returned"
                    disabled={actionLoading}
                    onClick={
                      handleReturnJob
                    }
                  >
                    <RotateCcw size={15} />

                    {actionLoading
                      ? "Saving..."
                      : "Confirm Return"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ================= ESTIMATE ================= */}

          <section className="details-section payment-details-section">
            <div className="details-section-heading">
              <div className="details-section-icon green">
                <IndianRupee size={18} />
              </div>

              <div>
                <h3>
                  Estimate & Payment
                </h3>

                <p>
                  Repair estimate,
                  advance and outstanding
                  balance
                </p>
              </div>
            </div>

            {!isEditing ? (
              <>
                <div className="details-payment-grid">
                  <div className="details-money-card">
                    <span>
                      Parts
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        estimate.partsAmount
                      )}
                    </strong>
                  </div>

                  <div className="details-money-card">
                    <span>
                      Labour
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        estimate.labourAmount
                      )}
                    </strong>
                  </div>

                  <div className="details-money-card">
                    <span>
                      Total Charge
                    </span>

                    <strong>
                      ₹
                      {formatMoney(amount)}
                    </strong>
                  </div>

                  <div className="details-money-card">
                    <span>
                      Advance Received
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        advance
                      )}
                    </strong>
                  </div>

                  <div className="details-money-card balance">
                    <span>
                      Balance Due
                    </span>

                    <strong>
                      ₹
                      {formatMoney(
                        balance
                      )}
                    </strong>
                  </div>
                </div>

                <div className="details-payment-status">
                  <div>
                    <CircleDollarSign
                      size={16}
                    />

                    <span>
                      Payment Status
                    </span>
                  </div>

                  <span
                    className={getPaymentClass(
                      payment
                    )}
                  >
                    {payment}
                  </span>
                </div>
              </>
            ) : (
              <div className="details-edit-grid payment">
                <div className="details-edit-field">
                  <label>
                    Total Repair Charge
                  </label>

                  <div className="details-edit-money">
                    <IndianRupee size={15} />

                    <input
                      type="number"
                      min="0"
                      name="amount"
                      value={
                        editData.amount
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>
                </div>

                <div className="details-edit-field">
                  <label>
                    Advance Received
                  </label>

                  <div className="details-edit-money">
                    <IndianRupee size={15} />

                    <input
                      type="number"
                      min="0"
                      name="advance"
                      value={
                        editData.advance
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>
                </div>

                <div className="details-edit-field">
                  <label>
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={
                      editData.priority
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option>
                      Normal
                    </option>

                    <option>
                      Urgent
                    </option>

                    <option>
                      High Priority
                    </option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* ================= BATTERY ================= */}

          {job.batteryUsed &&
            job.battery && (
              <section className="details-section details-battery-section">
                <div className="details-section-heading">
                  <div className="details-section-icon battery">
                    <BatteryCharging
                      size={18}
                    />
                  </div>

                  <div>
                    <h3>
                      Battery Tracking
                    </h3>

                    <p>
                      Battery linked with
                      this repair job
                    </p>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="details-battery-grid">
                    <div>
                      <span>
                        Battery Model
                      </span>

                      <strong>
                        {job.battery
                          .model || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>

                      <strong>
                        {job.battery
                          .status || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Quantity</span>

                      <strong>
                        {job.battery
                          .quantity || 1}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Cost Price
                      </span>

                      <strong>
                        ₹
                        {formatMoney(
                          job.battery
                            .costPrice
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Customer Price
                      </span>

                      <strong>
                        ₹
                        {formatMoney(
                          job.battery
                            .customerPrice
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Battery Payment
                      </span>

                      <strong>
                        {job.battery
                          .payment ||
                          "Pending"}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="details-edit-grid battery">
                    <div className="details-edit-field">
                      <label>
                        Battery Status
                      </label>

                      <select
                        name="batteryStatus"
                        value={
                          editData.batteryStatus
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option>
                          Required
                        </option>

                        <option>
                          Installed
                        </option>

                        <option>
                          Reserved
                        </option>

                        <option>
                          Returned
                        </option>
                      </select>
                    </div>

                    <div className="details-edit-field">
                      <label>
                        Battery Payment
                      </label>

                      <select
                        name="batteryPayment"
                        value={
                          editData.batteryPayment
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option>
                          Pending
                        </option>

                        <option>
                          Paid
                        </option>

                        <option>
                          Included in Repair Bill
                        </option>
                      </select>
                    </div>

                    <div className="details-edit-field">
                      <label>
                        Battery Cost Price
                      </label>

                      <div className="details-edit-money">
                        <IndianRupee
                          size={15}
                        />

                        <input
                          type="number"
                          min="0"
                          name="batteryCostPrice"
                          value={
                            editData.batteryCostPrice
                          }
                          onChange={
                            handleChange
                          }
                        />
                      </div>
                    </div>

                    <div className="details-edit-field">
                      <label>
                        Customer Price
                      </label>

                      <div className="details-edit-money">
                        <IndianRupee
                          size={15}
                        />

                        <input
                          type="number"
                          min="0"
                          name="batteryCustomerPrice"
                          value={
                            editData.batteryCustomerPrice
                          }
                          onChange={
                            handleChange
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

          {/* ================= HISTORY ================= */}

          {(stageHistory.length > 0 ||
            jobHistory.length > 0 ||
            transferHistory.length > 0 ||
            returnHistory.length > 0) && (
            <section className="details-section">
              <div className="details-section-heading">
                <div className="details-section-icon slate">
                  <History size={18} />
                </div>

                <div>
                  <h3>
                    Job History
                  </h3>

                  <p>
                    Lifecycle, transfer
                    and return activity
                  </p>
                </div>
              </div>

              <div className="details-history-list">

                {[...stageHistory]
                  .reverse()
                  .slice(0, 12)
                  .map((item, index) => (
                    <div
                      className="details-history-item transfer"
                      key={`stage-${index}`}
                    >
                      <div className="details-history-icon">
                        <Activity size={15} />
                      </div>

                      <div>
                        <strong>
                          {item.stage ||
                            "Repair Update"}
                        </strong>

                        <p>
                          {item.customerStatus ||
                            "Repair stage updated"}
                        </p>

                        <span>
                          {item.source ||
                            "System"}
                          {" • "}
                          {formatDateTime(
                            item.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  ))}

                {[...transferHistory]
                  .reverse()
                  .slice(0, 10)
                  .map((item, index) => (
                    <div
                      className="details-history-item transfer"
                      key={`transfer-${index}`}
                    >
                      <div className="details-history-icon">
                        <ArrowRightLeft
                          size={15}
                        />
                      </div>

                      <div>
                        <strong>
                          Technician Transfer
                        </strong>

                        <p>
                          {item.fromTechnician ||
                            "Unassigned"}
                          {" → "}
                          {item.toTechnician ||
                            "Technician"}
                        </p>

                        <span>
                          {item.reason ||
                            "No reason"}
                          {" • "}
                          {formatDateTime(
                            item.transferredAt
                          )}
                        </span>
                      </div>
                    </div>
                  ))}

                {[...returnHistory]
                  .reverse()
                  .slice(0, 10)
                  .map((item, index) => (
                    <div
                      className="details-history-item returned"
                      key={`return-${index}`}
                    >
                      <div className="details-history-icon">
                        <RotateCcw
                          size={15}
                        />
                      </div>

                      <div>
                        <strong>
                          {item.type ||
                            "Returned"}
                        </strong>

                        <p>
                          {item.reason ||
                            "Device returned"}
                        </p>

                        <span>
                          {item.technician ||
                            "Unassigned"}
                          {" • "}
                          {formatDateTime(
                            item.returnedAt
                          )}
                        </span>
                      </div>
                    </div>
                  ))}

                {[...jobHistory]
                  .reverse()
                  .slice(0, 10)
                  .map((item, index) => (
                    <div
                      className="details-history-item transfer"
                      key={`activity-${index}`}
                    >
                      <div className="details-history-icon">
                        <Clock3 size={15} />
                      </div>

                      <div>
                        <strong>
                          {item.action ||
                            "Job Activity"}
                        </strong>

                        <p>
                          {item.reason ||
                            item.targetTechnicianName ||
                            item.stage ||
                            "Repair workflow updated"}
                        </p>

                        <span>
                          {item.source ||
                            item.requestedByName ||
                            "System"}
                          {" • "}
                          {formatDateTime(
                            item.actionAt
                          )}
                        </span>
                      </div>
                    </div>
                  ))}

              </div>
            </section>
          )}

          {/* ================= INTERNAL NOTES ================= */}

          <section className="details-section">
            <div className="details-section-heading">
              <div className="details-section-icon slate">
                <NotebookText size={18} />
              </div>

              <div>
                <h3>
                  Internal Notes
                </h3>

                <p>
                  Private shop notes —
                  never customer-facing
                </p>
              </div>
            </div>

            {!isEditing ? (
              <div className="details-notes-box">
                <NotebookText
                  size={16}
                />

                <p>
                  {job.notes ||
                    job.internalNotes ||
                    "No internal notes added for this repair job."}
                </p>
              </div>
            ) : (
              <div className="details-edit-field full">
                <textarea
                  name="notes"
                  rows="4"
                  value={
                    editData.notes
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Internal notes..."
                />
              </div>
            )}
          </section>

          {/* ================= FOOTER ================= */}

          <div className="details-modal-footer">
            <div className="details-created-info">
              <Clock3 size={14} />

              <span>
                Job{" "}
                <strong>
                  {job.id}
                </strong>

                {" • "}

                {currentTechnicianName}
              </span>
            </div>

            <div className="details-footer-actions">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    className="details-edit-button"
                    onClick={() => {
                      setIsTransferOpen(
                        false
                      );

                      setIsReturnOpen(
                        false
                      );

                      setIsEditing(true);
                    }}
                  >
                    <Edit3 size={16} />
                    Edit Job
                  </button>

                  <button
                    type="button"
                    className="details-done-button"
                    onClick={onClose}
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="details-cancel-button"
                    onClick={
                      handleCancelEdit
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="details-save-button"
                    onClick={
                      handleSave
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <Save size={16} />

                    {actionLoading
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {isReceiptOpen && job && (
        <ThermalReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          job={job}
          autoPrint={false}
        />
      )}
    </div>
  );
};

export default JobDetailsModal;