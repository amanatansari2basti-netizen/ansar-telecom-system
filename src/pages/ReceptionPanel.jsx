import React, { useEffect, useMemo, useState } from "react";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import NewRepairJobModal from "../components/NewRepairJobModal";

import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  CircleDot,
  Clock3,
  Headphones,
  IndianRupee,
  PackageCheck,
  PauseCircle,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRoundCheck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";

import "./receptionPanel.css";

/* =========================================================
   HELPERS
========================================================= */

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const timestampToMillis = (value) => {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const getCustomerName = (job) =>
  job?.customerName ||
  job?.customer ||
  job?.name ||
  "Customer";

const getPhone = (job) =>
  job?.phone ||
  job?.customerPhone ||
  job?.mobile ||
  "N/A";

const getDevice = (job) =>
  job?.deviceModel ||
  job?.device ||
  `${job?.brand || ""} ${job?.model || ""}`.trim() ||
  "Device";

const getIssue = (job) =>
  job?.problem ||
  job?.issue ||
  job?.reportedProblem ||
  "Repair issue";

const getTechnicianName = (job) =>
  job?.technicianName ||
  job?.technician ||
  job?.assignedTechnician ||
  job?.assignedTo ||
  "Unassigned";

const getAmount = (job) =>
  toNumber(
    job?.estimate?.totalAmount ??
      job?.amount ??
      job?.estimatedCharge ??
      job?.totalAmount
  );

const getReceivedAmount = (job) =>
  toNumber(
    job?.receivedAmount ??
      job?.paidAmount ??
      job?.advance
  );

/* =========================================================
   V2 REPAIR STAGES
========================================================= */

const REPAIR_STAGES = {
  RECEIVED: "Device Received",
  DIAGNOSIS: "Diagnosis",
  WAITING_APPROVAL: "Waiting Customer Approval",
  APPROVED: "Approved",
  REPAIR: "Repair In Progress",
  WAITING_PART: "Waiting Part",
  TESTING: "Testing",
  READY: "Ready",
  DELIVERED: "Delivered",
  REJECTED: "Repair Rejected",
  RETURNED: "Returned to Reception",
  RETURN_WITHOUT_REPAIR: "Returned Without Repair",
};

const getRepairStage = (job) => {
  if (job?.repairStage) {
    return job.repairStage;
  }

  switch (job?.status) {
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
   RECEPTION PANEL
========================================================= */

const ReceptionPanel = () => {
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingTechs, setLoadingTechs] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isNewJobModalOpen, setIsNewJobModalOpen] =
    useState(false);

  const [actionLoading, setActionLoading] = useState("");
  const [actionError, setActionError] = useState("");

  const [rejectJobId, setRejectJobId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [deliveryJobId, setDeliveryJobId] = useState(null);
  const [deliveryPayment, setDeliveryPayment] = useState("");
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] =
    useState("Cash");
  const [deliveryMethod, setDeliveryMethod] =
    useState("Customer Pickup");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  /* =========================================================
     REALTIME JOBS
  ========================================================= */

  useEffect(() => {
    const jobsQuery = query(
      collection(db, "repairJobs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setJobs(list);
        setLoadingJobs(false);
      },
      (error) => {
        console.error("Reception jobs error:", error);
        setLoadingJobs(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================================
     REALTIME TECHNICIANS
  ========================================================= */

  useEffect(() => {
    const usersQuery = query(collection(db, "users"));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const list = [];

        snapshot.forEach((item) => {
          const data = item.data();

          if (normalizeText(data.role) !== "technician") {
            return;
          }

          if (
            ["inactive", "disabled"].includes(
              normalizeText(data.status)
            )
          ) {
            return;
          }

          list.push({
            id: item.id,
            uid: item.id,
            ...data,
          });
        });

        setTechnicians(list);
        setLoadingTechs(false);
      },
      (error) => {
        console.error("Reception technicians error:", error);
        setLoadingTechs(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* =========================================================
     TECHNICIAN HELPERS
  ========================================================= */

  const getTechName = (tech) =>
    tech?.name ||
    tech?.fullName ||
    tech?.technicianName ||
    "Technician";

  const isJobAssignedToTech = (job, tech) => {
    const techId = String(tech?.id || "");

    const jobIds = [
      job?.technicianId,
      job?.technicianUid,
      job?.assignedTechnicianId,
      job?.assignedToId,
      job?.userId,
    ]
      .filter(Boolean)
      .map(String);

    if (jobIds.length > 0) {
      return jobIds.includes(techId);
    }

    const techName = normalizeText(getTechName(tech));

    const names = [
      job?.technician,
      job?.technicianName,
      job?.assignedTechnician,
      job?.assignedTo,
    ]
      .filter(Boolean)
      .map(normalizeText);

    return names.includes(techName);
  };

  const enrichedTechnicians = useMemo(() => {
    return technicians.map((tech) => {
      const techJobs = jobs.filter(
        (job) =>
          isJobAssignedToTech(job, tech) &&
          ["Pending", "In Progress", "Paused"].includes(
            job.status
          )
      );

      const activeJobs = techJobs.filter(
        (job) => job.status === "In Progress"
      ).length;

      const availability =
        tech.availabilityStatus ||
        (activeJobs > 0 || techJobs.length > 0
          ? "Busy"
          : "Available");

      return {
        ...tech,
        workload: techJobs.length,
        activeJobs,
        availability,
      };
    });
  }, [technicians, jobs]);

  const assignableTechnicians = useMemo(
    () =>
      enrichedTechnicians.filter(
        (tech) =>
          normalizeText(tech.status) !== "inactive" &&
          normalizeText(tech.status) !== "disabled"
      ),
    [enrichedTechnicians]
  );

  /* =========================================================
     CREATE JOB
  ========================================================= */

  const handleCreateJob = async (jobData) => {
    try {
      const counterRef = doc(
        db,
        "counters",
        "repairJobs"
      );

      await runTransaction(db, async (transaction) => {
        const counterDoc =
          await transaction.get(counterRef);

        let nextNumber = 1049;

        if (counterDoc.exists()) {
          nextNumber =
            toNumber(counterDoc.data().lastNumber || 1048) + 1;
        }

        const newJobId = `AT-${nextNumber}`;

        const newJobRef = doc(
          db,
          "repairJobs",
          newJobId
        );

        const assignedUid =
          jobData.technicianId ||
          jobData.technicianUid ||
          jobData.assignedTechnicianId ||
          jobData.assignedToId ||
          "";

        const assignedTech = technicians.find(
          (tech) => String(tech.id) === String(assignedUid)
        );

        const assignedName =
          jobData.technicianName ||
          jobData.technician ||
          (assignedTech ? getTechName(assignedTech) : "");

        transaction.set(newJobRef, {
          ...jobData,

          id: newJobId,

          status: "Pending",

          repairStage:
            jobData.repairStage ||
            REPAIR_STAGES.RECEIVED,

          customerStatus:
            jobData.customerStatus ||
            "Your device has been received at Ansar Telecom.",

          customerStatusCode:
            jobData.customerStatusCode ||
            "DEVICE_RECEIVED",

          technician: assignedName,
          technicianName: assignedName,

          technicianId: assignedUid,
          technicianUid: assignedUid,
          assignedTechnicianId: assignedUid,
          assignedToId: assignedUid,

          assignedAt: assignedUid
            ? serverTimestamp()
            : null,

          startedAt: null,
          completedAt: null,

          pausedAt: null,
          pauseReason: "",

          totalPausedSeconds: 0,
          totalTimeSeconds: 0,

          transferRequest: {
            status: "",
          },

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.set(
          counterRef,
          {
            lastNumber: nextNumber,
            updatedAt: serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      });

      return true;
    } catch (error) {
      console.error("Create job error:", error);

      throw new Error(
        error?.message || "Failed to create repair job."
      );
    }
  };

  /* =========================================================
     APPROVE CUSTOMER REPAIR
  ========================================================= */

  const handleApproveRepair = async (job) => {
    if (!job?.id) return;

    if (
      getRepairStage(job) !==
      REPAIR_STAGES.WAITING_APPROVAL
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Confirm that ${getCustomerName(
        job
      )} approved repair for ${job.id}?`
    );

    if (!confirmed) return;

    try {
      setActionError("");
      setActionLoading(`approve-${job.id}`);

      const partStatus = normalizeText(
        job?.partRequirement?.status
      );

      const waitingForPart = [
        "required",
        "pending",
        "waiting",
      ].includes(partStatus);

      const pausedAt = timestampToMillis(job.pausedAt);

      const currentPauseSeconds = pausedAt
        ? Math.max(
            0,
            Math.floor((Date.now() - pausedAt) / 1000)
          )
        : 0;

      if (waitingForPart) {
        await updateDoc(
          doc(db, "repairJobs", job.id),
          {
            status: "Paused",

            repairStage:
              REPAIR_STAGES.WAITING_PART,

            customerStatus:
              "Repair has been approved. The required part is being arranged.",

            customerStatusCode:
              "WAITING_PART",

            "customerApproval.status":
              "Approved",

            "customerApproval.source":
              "Reception",

            "customerApproval.respondedAt":
              serverTimestamp(),

            "customerApproval.approvedAt":
              serverTimestamp(),

            "customerApproval.rejectedAt":
              null,

            pauseReason:
              "Waiting for Part",

            approvalConfirmedBy:
              "Reception",

            approvalConfirmedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      } else {
        await updateDoc(
          doc(db, "repairJobs", job.id),
          {
            status: "In Progress",

            repairStage:
              REPAIR_STAGES.REPAIR,

            customerStatus:
              "Your repair has been approved and repair work is now in progress.",

            customerStatusCode:
              "REPAIR_IN_PROGRESS",

            "customerApproval.status":
              "Approved",

            "customerApproval.source":
              "Reception",

            "customerApproval.respondedAt":
              serverTimestamp(),

            "customerApproval.approvedAt":
              serverTimestamp(),

            "customerApproval.rejectedAt":
              null,

            pausedAt: null,
            pauseReason: "",

            lastResumedAt:
              serverTimestamp(),

            totalPausedSeconds:
              toNumber(job.totalPausedSeconds) +
              currentPauseSeconds,

            approvalConfirmedBy:
              "Reception",

            approvalConfirmedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      }
    } catch (error) {
      console.error("Repair approval error:", error);

      setActionError(
        error?.message ||
          "Unable to approve repair."
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =========================================================
     REJECT CUSTOMER REPAIR
  ========================================================= */

  const handleRejectRepair = async (job) => {
    const reason = rejectionReason.trim();

    if (!reason) {
      setActionError(
        "Rejection reason is required."
      );

      return;
    }

    try {
      setActionError("");
      setActionLoading(`reject-${job.id}`);

      await updateDoc(
        doc(db, "repairJobs", job.id),
        {
          status: "Returned",

          repairStage:
            REPAIR_STAGES.RETURN_WITHOUT_REPAIR,

          customerStatus:
            "Repair was not approved. Your device is being prepared for return.",

          customerStatusCode:
            "REPAIR_NOT_APPROVED",

          "customerApproval.status":
            "Rejected",

          "customerApproval.source":
            "Reception",

          "customerApproval.respondedAt":
            serverTimestamp(),

          "customerApproval.rejectedAt":
            serverTimestamp(),

          "customerApproval.approvedAt":
            null,

          "customerApproval.notes":
            reason,

          repairRejectedReason:
            reason,

          repairRejectedBy:
            "Reception",

          repairRejectedAt:
            serverTimestamp(),

          pausedAt: null,

          pauseReason: "",

          "delivery.status":
            "Awaiting Customer Collection",

          updatedAt:
            serverTimestamp(),
        }
      );

      setRejectJobId(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Repair rejection error:", error);

      setActionError(
        error?.message ||
          "Unable to reject repair."
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =========================================================
     V2 TRANSFER REQUEST APPROVAL
  ========================================================= */

  const handleTransferRequest = async (job, approve) => {
    const request = job?.transferRequest;

    if (!job?.id || normalizeText(request?.status) !== "pending") return;

    const targetUid =
      request?.targetTechnicianId || request?.targetTechnicianUid || "";

    const target = technicians.find(
      (tech) => String(tech.id) === String(targetUid)
    );

    const targetName =
      request?.targetTechnicianName ||
      request?.targetTechnician ||
      (target ? getTechName(target) : "");

    const fromTechnicianId =
      request?.requestedByUid ||
      job?.technicianId ||
      job?.technicianUid ||
      job?.assignedTechnicianId ||
      job?.assignedToId ||
      "";

    const fromTechnicianName =
      request?.requestedByName || getTechnicianName(job);

    // Use the live job state at approval time so a stale request cannot
    // rewind the lifecycle or timer state.
    const previousStatus = job?.status || request?.previousStatus || "Pending";
    const previousRepairStage =
      getRepairStage(job) ||
      request?.previousRepairStage ||
      REPAIR_STAGES.RECEIVED;

    const decisionTime = new Date().toISOString();

    if (!approve) {
      const confirmed = window.confirm(
        `Reject transfer request for ${job.id}?`
      );

      if (!confirmed) return;

      try {
        setActionError("");
        setActionLoading(`transfer-reject-${job.id}`);

        await updateDoc(doc(db, "repairJobs", job.id), {
          "transferRequest.status": "rejected",
          "transferRequest.decidedByUid": "",
          "transferRequest.decidedByName": "Reception",
          "transferRequest.decidedAt": serverTimestamp(),
          "transferRequest.decisionSource": "Reception",
          jobHistory: arrayUnion({
            action: "Transfer Rejected",
            jobId: job.id,
            requestedByUid: request?.requestedByUid || "",
            requestedByName: fromTechnicianName,
            targetTechnicianId: targetUid,
            targetTechnicianName: targetName,
            reason: request?.reason || "",
            previousStatus,
            previousRepairStage,
            decidedByUid: "",
            decidedByName: "Reception",
            decisionSource: "Reception",
            actionAt: decisionTime,
          }),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Transfer rejection error:", error);
        setActionError(
          error?.message || "Unable to reject transfer request."
        );
      } finally {
        setActionLoading("");
      }

      return;
    }

    if (!targetUid && !targetName) {
      setActionError("Transfer target technician is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Approve transfer of ${job.id} from ${fromTechnicianName} to ${
        targetName || "selected technician"
      }?`
    );

    if (!confirmed) return;

    try {
      setActionError("");
      setActionLoading(`transfer-approve-${job.id}`);

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
        reason: request?.reason || "",
        workedSeconds: toNumber(request?.workedSeconds),
        previousStatus,
        newStatus: nextStatus,
        previousRepairStage,
        repairStage: previousRepairStage,
        decidedByUid: "",
        decidedByName: "Reception",
        decisionSource: "Reception",
        actionAt: decisionTime,
      };

      const transferAuditEntry = {
        fromTechnicianId,
        fromTechnicianName,
        toTechnicianId: targetUid,
        toTechnicianName: targetName,
        reason: request?.reason || "",
        workedSeconds: toNumber(request?.workedSeconds),
        previousStatus,
        handoffStatus: nextStatus,
        repairStage: previousRepairStage,
        approvedByUid: "",
        approvedByName: "Reception",
        decisionSource: "Reception",
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
        transferredAt: serverTimestamp(),
        transferredFromUid: fromTechnicianId,
        transferredFromName: fromTechnicianName,
        transferredToUid: targetUid,
        transferredToName: targetName,
        transferReason: request?.reason || "",
        previousTechnicianWorkSeconds: toNumber(request?.workedSeconds),
        "transferRequest.status": "approved",
        "transferRequest.decidedByUid": "",
        "transferRequest.decidedByName": "Reception",
        "transferRequest.decidedAt": serverTimestamp(),
        "transferRequest.decisionSource": "Reception",
        transferredBy: "Reception",
        transferredByUid: "",
        jobHistory: arrayUnion(transferHistoryEntry),
        transferHistory: arrayUnion(transferAuditEntry),
        updatedAt: serverTimestamp(),
      };

      // Safe handoff: active work pauses for the target technician to resume.
      // startedAt, completedAt, totalPausedSeconds, totalTimeSeconds and
      // customer-facing status are intentionally preserved.
      if (normalizedPreviousStatus === "in progress") {
        updates.pausedAt = serverTimestamp();
        updates.pauseReason = "Transferred - waiting for technician to resume";
        updates.stageBeforePause = previousRepairStage;
      } else if (normalizedPreviousStatus === "paused") {
        updates.stageBeforePause = job?.stageBeforePause || previousRepairStage;
      }

      await updateDoc(doc(db, "repairJobs", job.id), updates);
    } catch (error) {
      console.error("Transfer approval error:", error);
      setActionError(
        error?.message || "Unable to approve transfer request."
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =========================================================
     DELIVERY
  ========================================================= */

  const openDelivery = (job) => {
    const balance = Math.max(
      0,
      getAmount(job) -
        getReceivedAmount(job)
    );

    setDeliveryJobId(job.id);

    setDeliveryPayment(
      balance > 0
        ? String(balance)
        : ""
    );

    setDeliveryPaymentMethod("Cash");
    setDeliveryMethod("Customer Pickup");
    setDeliveryNotes("");
    setActionError("");
  };

  const closeDelivery = () => {
    setDeliveryJobId(null);
    setDeliveryPayment("");
    setDeliveryPaymentMethod("Cash");
    setDeliveryMethod("Customer Pickup");
    setDeliveryNotes("");
  };

  const handleDeliverJob = async (job) => {
    const total = getAmount(job);
    const alreadyReceived =
      getReceivedAmount(job);

    const receivedNow =
      Math.max(
        0,
        toNumber(deliveryPayment)
      );

    if (
      receivedNow >
      Math.max(
        0,
        total - alreadyReceived
      )
    ) {
      setActionError(
        "Received amount cannot be more than pending balance."
      );

      return;
    }

    const newReceived =
      alreadyReceived +
      receivedNow;

    const balance =
      Math.max(
        0,
        total - newReceived
      );

    if (balance > 0) {
      const continueDelivery =
        window.confirm(
          `${formatCurrency(
            balance
          )} will remain pending. Deliver device anyway?`
        );

      if (!continueDelivery) {
        return;
      }
    }

    const confirmed =
      window.confirm(
        `Confirm delivery of ${getDevice(
          job
        )} to ${getCustomerName(job)}?`
      );

    if (!confirmed) return;

    try {
      setActionError("");
      setActionLoading(
        `delivery-${job.id}`
      );

      await updateDoc(
        doc(db, "repairJobs", job.id),
        {
          status:
            "Completed",

          repairStage:
            REPAIR_STAGES.DELIVERED,

          customerStatus:
            "Your device has been delivered successfully.",

          customerStatusCode:
            "DELIVERED",

          amount:
            total,

          totalAmount:
            total,

          receivedAmount:
            newReceived,

          paidAmount:
            newReceived,

          balanceAmount:
            balance,

          paymentStatus:
            balance <= 0
              ? "Paid"
              : newReceived > 0
              ? "Partial"
              : "Pending",

          paymentMethod:
            receivedNow > 0
              ? deliveryPaymentMethod
              : job.paymentMethod || "",

          lastPaymentAmount:
            receivedNow,

          lastPaymentAt:
            receivedNow > 0
              ? serverTimestamp()
              : job.lastPaymentAt || null,

          "delivery.status":
            "Delivered",

          "delivery.method":
            deliveryMethod,

          "delivery.deliveredAt":
            serverTimestamp(),

          "delivery.deliveredBy":
            "Reception",

          "delivery.notes":
            deliveryNotes.trim(),

          deliveredAt:
            serverTimestamp(),

          deliveredBy:
            "Reception",

          deliveryMethod,

          completedAt:
            job.completedAt ||
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      closeDelivery();
    } catch (error) {
      console.error(
        "Delivery error:",
        error
      );

      setActionError(
        error?.message ||
          "Unable to deliver device."
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredJobs = useMemo(() => {
    const search =
      normalizeText(searchQuery);

    return jobs.filter((job) => {
      const stage =
        getRepairStage(job);

      const matchesSearch =
        !search ||
        [
          job.id,
          getCustomerName(job),
          getPhone(job),
          getDevice(job),
          getIssue(job),
          getTechnicianName(job),
          stage,
        ].some((value) =>
          normalizeText(value).includes(search)
        );

      let matchesStatus = true;

      if (statusFilter !== "All") {
        if (statusFilter === "Transfer Requests") {
          matchesStatus =
            normalizeText(
              job?.transferRequest?.status
            ) === "pending";
        } else {
          matchesStatus =
            job.status === statusFilter ||
            stage === statusFilter;
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    const pending = jobs.filter(
      (job) =>
        job.status === "Pending"
    ).length;

    const active = jobs.filter(
      (job) =>
        job.status === "In Progress"
    ).length;

    const ready = jobs.filter(
      (job) =>
        getRepairStage(job) ===
        REPAIR_STAGES.READY
    ).length;

    const approval = jobs.filter(
      (job) =>
        getRepairStage(job) ===
        REPAIR_STAGES.WAITING_APPROVAL
    ).length;

    const transfers = jobs.filter(
      (job) =>
        normalizeText(
          job?.transferRequest?.status
        ) === "pending"
    ).length;

    const totalRevenue =
      jobs.reduce(
        (sum, job) =>
          sum + getAmount(job),
        0
      );

    return {
      pending,
      active,
      ready,
      approval,
      transfers,
      totalRevenue,
    };
  }, [jobs]);

  const transferRequests = useMemo(
    () =>
      jobs.filter(
        (job) =>
          normalizeText(
            job?.transferRequest?.status
          ) === "pending"
      ),
    [jobs]
  );

  const waitingApprovalJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          getRepairStage(job) ===
          REPAIR_STAGES.WAITING_APPROVAL
      ),
    [jobs]
  );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loadingJobs || loadingTechs) {
    return (
      <main className="reception-panel">
        <div
          style={{
            minHeight: "70vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <Wrench size={30} />

            <h3>
              Loading Reception Workspace...
            </h3>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="reception-panel">
      <div className="rp-page">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="rp-hero">
          <div className="rp-hero-content">
            <span className="rp-eyebrow">
              <Sparkles size={14} />
              ANSAR TELECOM
            </span>

            <h1>
              Reception
              <span> Control Center</span>
            </h1>

            <p>
              Book devices, monitor repairs,
              manage customer approvals,
              technician transfers and final
              delivery from one workspace.
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                className="rp-primary-btn"
                onClick={() =>
                  setIsNewJobModalOpen(true)
                }
              >
                <Plus size={16} />
                New Repair Job
              </button>
            </div>
          </div>

          <div className="rp-hero-icon">
            <Headphones size={36} />
          </div>
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="rp-stats-grid">
          <div className="rp-stat-card">
            <CircleDot size={18} />
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>

          <div className="rp-stat-card">
            <Activity size={18} />
            <span>In Progress</span>
            <strong>{stats.active}</strong>
          </div>

          <div className="rp-stat-card">
            <AlertCircle size={18} />
            <span>Approval</span>
            <strong>{stats.approval}</strong>
          </div>

          <div className="rp-stat-card">
            <ArrowRightLeft size={18} />
            <span>Transfers</span>
            <strong>{stats.transfers}</strong>
          </div>

          <div className="rp-stat-card">
            <CheckCircle2 size={18} />
            <span>Ready</span>
            <strong>{stats.ready}</strong>
          </div>
        </section>

        {/* =====================================================
            ACTION ERROR
        ===================================================== */}

        {actionError && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #f0b7b7",
              background: "#fff6f6",
              color: "#9f2525",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <AlertCircle
              size={15}
              style={{
                verticalAlign: "middle",
                marginRight: "7px",
              }}
            />

            {actionError}
          </div>
        )}

        {/* =====================================================
            ATTENTION CENTER
        ===================================================== */}

        {(transferRequests.length > 0 ||
          waitingApprovalJobs.length > 0) && (
          <section className="rp-section-card">
            <div className="rp-section-heading">
              <div>
                <span className="rp-section-kicker">
                  ACTION REQUIRED
                </span>

                <h2>
                  Reception Attention Center
                </h2>

                <p>
                  Requests that need manual
                  confirmation.
                </p>
              </div>
            </div>

            {/* TRANSFER REQUESTS */}

            {transferRequests.map((job) => {
              const request =
                job.transferRequest || {};

              return (
                <div
                  key={`transfer-${job.id}`}
                  style={{
                    margin: "0 16px 14px",
                    padding: "15px",
                    border: "1px solid #d8e2f1",
                    borderRadius: "13px",
                    background: "#f8fbff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          color: "#667085",
                        }}
                      >
                        TRANSFER REQUEST •{" "}
                        {job.id}
                      </span>

                      <h3
                        style={{
                          margin: "5px 0 3px",
                          fontSize: "15px",
                        }}
                      >
                        {getDevice(job)}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: "#667085",
                        }}
                      >
                        {request.requestedByName ||
                          getTechnicianName(job)}
                        {" → "}
                        <strong>
                          {request.targetTechnicianName ||
                            "Technician"}
                        </strong>
                      </p>
                    </div>

                    <ArrowRightLeft size={20} />
                  </div>

                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      borderRadius: "9px",
                      background: "#fff",
                      fontSize: "11px",
                    }}
                  >
                    <strong>Reason:</strong>{" "}
                    {request.reason ||
                      "No reason provided."}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      type="button"
                      className="rp-primary-btn"
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        handleTransferRequest(
                          job,
                          true
                        )
                      }
                    >
                      <CheckCircle2 size={14} />

                      {actionLoading ===
                      `transfer-approve-${job.id}`
                        ? "Approving..."
                        : "Approve Transfer"}
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        handleTransferRequest(
                          job,
                          false
                        )
                      }
                      style={{
                        border:
                          "1px solid #e2b5b5",
                        background: "#fff",
                        color: "#a52a2a",
                        padding: "9px 12px",
                        borderRadius: "9px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 700,
                        fontSize: "11px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <XCircle size={14} />

                      {actionLoading ===
                      `transfer-reject-${job.id}`
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* =====================================================
            TECHNICIANS
        ===================================================== */}

        <section className="rp-section-card">
          <div className="rp-section-heading">
            <div>
              <span className="rp-section-kicker">
                LIVE TEAM
              </span>

              <h2>
                Technician Availability
              </h2>

              <p>
                Current workload and presence.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              padding: "0 16px 16px",
            }}
          >
            {enrichedTechnicians.map((tech) => (
              <div
                key={tech.id}
                style={{
                  border:
                    "1px solid #e9edf3",
                  borderRadius: "12px",
                  padding: "13px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "8px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "12px",
                    }}
                  >
                    {getTechName(tech)}
                  </strong>

                  <UserRoundCheck size={15} />
                </div>

                <p
                  style={{
                    margin: "7px 0 0",
                    fontSize: "10px",
                    color: "#667085",
                  }}
                >
                  {tech.availability} •{" "}
                  {tech.workload} active job
                  {tech.workload === 1
                    ? ""
                    : "s"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            SEARCH + FILTER
        ===================================================== */}

        <section className="rp-section-card">
          <div className="rp-section-heading">
            <div>
              <span className="rp-section-kicker">
                REPAIR QUEUE
              </span>

              <h2>
                Live Repair Jobs
              </h2>

              <p>
                Search and manage all active
                customer devices.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "0 16px 16px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "1 1 260px",
                position: "relative",
              }}
            >
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                }}
              />

              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search job, customer, phone, device..."
                style={{
                  width: "100%",
                  padding:
                    "11px 12px 11px 36px",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              style={{
                minWidth: "180px",
                padding: "10px",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "10px",
              }}
            >
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Paused</option>
              <option>Ready</option>
              <option>Completed</option>
              <option>Returned</option>
              <option>
                Waiting Customer Approval
              </option>
              <option>Waiting Part</option>
              <option>Testing</option>
              <option>
                Transfer Requests
              </option>
            </select>
          </div>

          {/* ===================================================
              JOB CARDS
          =================================================== */}

          <div
            style={{
              display: "grid",
              gap: "12px",
              padding: "0 16px 18px",
            }}
          >
            {filteredJobs.length === 0 ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#667085",
                }}
              >
                <Smartphone size={25} />

                <h3>
                  No repair jobs found
                </h3>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const stage =
                  getRepairStage(job);

                const waitingApproval =
                  stage ===
                  REPAIR_STAGES.WAITING_APPROVAL;

                const waitingPart =
                  stage ===
                  REPAIR_STAGES.WAITING_PART;

                const ready =
                  stage ===
                    REPAIR_STAGES.READY ||
                  job.status === "Ready";

                const transferPending =
                  normalizeText(
                    job?.transferRequest?.status
                  ) === "pending";

                const amount =
                  getAmount(job);

                const received =
                  getReceivedAmount(job);

                const balance =
                  Math.max(
                    0,
                    amount - received
                  );

                return (
                  <article
                    key={job.id}
                    style={{
                      border:
                        "1px solid #e8edf3",
                      borderRadius: "14px",
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        padding: "15px",
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: "#667085",
                          }}
                        >
                          {job.id}
                        </span>

                        <h3
                          style={{
                            margin:
                              "5px 0 3px",
                            fontSize: "15px",
                          }}
                        >
                          {getDevice(job)}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            color: "#667085",
                          }}
                        >
                          {getCustomerName(job)}
                          {" • "}
                          {getPhone(job)}
                        </p>
                      </div>

                      <span
                        style={{
                          padding: "6px 9px",
                          borderRadius: "999px",
                          background: "#f2f5f8",
                          fontSize: "10px",
                          fontWeight: 800,
                        }}
                      >
                        {stage}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "0 15px 15px",
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "9px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: "9px",
                            color: "#8b95a5",
                          }}
                        >
                          PROBLEM
                        </span>

                        <strong
                          style={{
                            fontSize: "11px",
                          }}
                        >
                          {getIssue(job)}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: "9px",
                            color: "#8b95a5",
                          }}
                        >
                          TECHNICIAN
                        </span>

                        <strong
                          style={{
                            fontSize: "11px",
                          }}
                        >
                          {getTechnicianName(job)}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: "9px",
                            color: "#8b95a5",
                          }}
                        >
                          AMOUNT
                        </span>

                        <strong
                          style={{
                            fontSize: "11px",
                          }}
                        >
                          {formatCurrency(amount)}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={{
                            display: "block",
                            fontSize: "9px",
                            color: "#8b95a5",
                          }}
                        >
                          BALANCE
                        </span>

                        <strong
                          style={{
                            fontSize: "11px",
                          }}
                        >
                          {formatCurrency(balance)}
                        </strong>
                      </div>
                    </div>

                    {job.customerStatus && (
                      <div
                        style={{
                          margin:
                            "0 15px 15px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: "#f8fafc",
                          fontSize: "10px",
                          color: "#667085",
                        }}
                      >
                        <strong>
                          Customer Status:
                        </strong>{" "}
                        {job.customerStatus}
                      </div>
                    )}

                    {/* CUSTOMER APPROVAL */}

                    {waitingApproval && (
                      <div
                        style={{
                          margin:
                            "0 15px 15px",
                          padding: "13px",
                          borderRadius: "12px",
                          border:
                            "1px solid #f2d89b",
                          background: "#fffaf0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <AlertCircle
                            size={16}
                          />

                          <div>
                            <strong
                              style={{
                                fontSize: "11px",
                              }}
                            >
                              Customer approval
                              required
                            </strong>

                            <p
                              style={{
                                margin:
                                  "4px 0 0",
                                fontSize: "10px",
                              }}
                            >
                              Confirm only after
                              customer agrees to
                              the estimate.
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "10px",
                          }}
                        >
                          <button
                            type="button"
                            className="rp-primary-btn"
                            disabled={Boolean(
                              actionLoading
                            )}
                            onClick={() =>
                              handleApproveRepair(
                                job
                              )
                            }
                          >
                            <CheckCircle2
                              size={13}
                            />

                            {actionLoading ===
                            `approve-${job.id}`
                              ? "Approving..."
                              : "Approve Repair"}
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(
                              actionLoading
                            )}
                            onClick={() => {
                              setRejectJobId(
                                rejectJobId ===
                                  job.id
                                  ? null
                                  : job.id
                              );

                              setRejectionReason(
                                ""
                              );

                              setActionError("");
                            }}
                            style={{
                              border:
                                "1px solid #e6b7b7",
                              borderRadius: "9px",
                              padding: "9px 12px",
                              background: "#fff",
                              color: "#a52a2a",
                              fontFamily: "inherit",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <XCircle size={13} />
                            Reject Repair
                          </button>
                        </div>

                        {rejectJobId ===
                          job.id && (
                          <div
                            style={{
                              marginTop: "10px",
                            }}
                          >
                            <textarea
                              value={
                                rejectionReason
                              }
                              onChange={(event) =>
                                setRejectionReason(
                                  event.target.value
                                )
                              }
                              placeholder="Why did the customer reject the repair?"
                              style={{
                                width: "100%",
                                minHeight: "65px",
                                padding: "10px",
                                border:
                                  "1px solid #e4d5b8",
                                borderRadius: "9px",
                                resize: "vertical",
                              }}
                            />

                            <button
                              type="button"
                              className="rp-primary-btn"
                              disabled={Boolean(
                                actionLoading
                              )}
                              onClick={() =>
                                handleRejectRepair(
                                  job
                                )
                              }
                              style={{
                                marginTop: "8px",
                              }}
                            >
                              Confirm Rejection
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WAITING PART */}

                    {waitingPart && (
                      <div
                        style={{
                          margin:
                            "0 15px 15px",
                          padding: "12px",
                          borderRadius: "11px",
                          background: "#fff8e8",
                          border:
                            "1px solid #ecd7a4",
                          fontSize: "11px",
                        }}
                      >
                        <PauseCircle
                          size={14}
                          style={{
                            verticalAlign:
                              "middle",
                            marginRight: "6px",
                          }}
                        />

                        Waiting for{" "}
                        <strong>
                          {job?.partRequirement
                            ?.partName ||
                            "required part"}
                        </strong>
                        .
                      </div>
                    )}

                    {/* TRANSFER REQUEST */}

                    {transferPending && (
                      <div
                        style={{
                          margin:
                            "0 15px 15px",
                          padding: "13px",
                          borderRadius: "12px",
                          background: "#f7faff",
                          border:
                            "1px solid #d8e3f4",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems:
                              "center",
                          }}
                        >
                          <ArrowRightLeft
                            size={15}
                          />

                          <strong
                            style={{
                              fontSize: "11px",
                            }}
                          >
                            Transfer Request
                          </strong>
                        </div>

                        <p
                          style={{
                            margin:
                              "7px 0 0",
                            fontSize: "10px",
                          }}
                        >
                          {job.transferRequest
                            ?.requestedByName ||
                            getTechnicianName(job)}
                          {" → "}
                          <strong>
                            {job.transferRequest
                              ?.targetTechnicianName ||
                              "Technician"}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin:
                              "4px 0 0",
                            fontSize: "10px",
                            color: "#667085",
                          }}
                        >
                          Reason:{" "}
                          {job.transferRequest
                            ?.reason ||
                            "Not provided"}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="rp-primary-btn"
                            disabled={Boolean(
                              actionLoading
                            )}
                            onClick={() =>
                              handleTransferRequest(
                                job,
                                true
                              )
                            }
                          >
                            <CheckCircle2
                              size={13}
                            />
                            Approve Transfer
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(
                              actionLoading
                            )}
                            onClick={() =>
                              handleTransferRequest(
                                job,
                                false
                              )
                            }
                            style={{
                              border:
                                "1px solid #e6b7b7",
                              borderRadius: "9px",
                              padding: "9px 12px",
                              background: "#fff",
                              color: "#a52a2a",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* READY / DELIVERY */}

                    {ready && (
                      <div
                        style={{
                          margin:
                            "0 15px 15px",
                          padding: "13px",
                          borderRadius: "12px",
                          background: "#f4fbf7",
                          border:
                            "1px solid #cfe7d8",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "7px",
                          }}
                        >
                          <PackageCheck
                            size={16}
                          />

                          <strong
                            style={{
                              fontSize: "11px",
                            }}
                          >
                            Device Ready for
                            Delivery
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="rp-primary-btn"
                          onClick={() =>
                            openDelivery(job)
                          }
                          style={{
                            marginTop: "10px",
                          }}
                        >
                          <PackageCheck
                            size={13}
                          />
                          Deliver Device
                        </button>

                        {deliveryJobId ===
                          job.id && (
                          <div
                            style={{
                              marginTop: "12px",
                              paddingTop: "12px",
                              borderTop:
                                "1px solid #d7e8dc",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit,minmax(150px,1fr))",
                                gap: "8px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize:
                                      "9px",
                                    color:
                                      "#667085",
                                  }}
                                >
                                  TOTAL
                                </span>

                                <strong
                                  style={{
                                    display:
                                      "block",
                                  }}
                                >
                                  {formatCurrency(
                                    amount
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span
                                  style={{
                                    fontSize:
                                      "9px",
                                    color:
                                      "#667085",
                                  }}
                                >
                                  RECEIVED
                                </span>

                                <strong
                                  style={{
                                    display:
                                      "block",
                                  }}
                                >
                                  {formatCurrency(
                                    received
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span
                                  style={{
                                    fontSize:
                                      "9px",
                                    color:
                                      "#667085",
                                  }}
                                >
                                  BALANCE
                                </span>

                                <strong
                                  style={{
                                    display:
                                      "block",
                                  }}
                                >
                                  {formatCurrency(
                                    balance
                                  )}
                                </strong>
                              </div>
                            </div>

                            <input
                              type="number"
                              min="0"
                              value={
                                deliveryPayment
                              }
                              onChange={(event) =>
                                setDeliveryPayment(
                                  event.target.value
                                )
                              }
                              placeholder="Payment received now"
                              style={{
                                width: "100%",
                                marginTop: "10px",
                                padding: "10px",
                                border:
                                  "1px solid #dbe5df",
                                borderRadius: "9px",
                              }}
                            />

                            <select
                              value={
                                deliveryPaymentMethod
                              }
                              onChange={(event) =>
                                setDeliveryPaymentMethod(
                                  event.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                marginTop: "8px",
                                padding: "10px",
                                border:
                                  "1px solid #dbe5df",
                                borderRadius: "9px",
                              }}
                            >
                              <option>Cash</option>
                              <option>UPI</option>
                              <option>Card</option>
                            </select>

                            <select
                              value={
                                deliveryMethod
                              }
                              onChange={(event) =>
                                setDeliveryMethod(
                                  event.target.value
                                )
                              }
                              style={{
                                width: "100%",
                                marginTop: "8px",
                                padding: "10px",
                                border:
                                  "1px solid #dbe5df",
                                borderRadius: "9px",
                              }}
                            >
                              <option>
                                Customer Pickup
                              </option>

                              <option>
                                Home Delivery
                              </option>
                            </select>

                            <textarea
                              value={
                                deliveryNotes
                              }
                              onChange={(event) =>
                                setDeliveryNotes(
                                  event.target.value
                                )
                              }
                              placeholder="Delivery notes (optional)"
                              style={{
                                width: "100%",
                                minHeight: "60px",
                                marginTop: "8px",
                                padding: "10px",
                                border:
                                  "1px solid #dbe5df",
                                borderRadius: "9px",
                                resize: "vertical",
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginTop: "10px",
                              }}
                            >
                              <button
                                type="button"
                                className="rp-primary-btn"
                                disabled={Boolean(
                                  actionLoading
                                )}
                                onClick={() =>
                                  handleDeliverJob(
                                    job
                                  )
                                }
                              >
                                <CheckCircle2
                                  size={13}
                                />

                                {actionLoading ===
                                `delivery-${job.id}`
                                  ? "Saving..."
                                  : "Confirm Delivery"}
                              </button>

                              <button
                                type="button"
                                onClick={
                                  closeDelivery
                                }
                                style={{
                                  border:
                                    "1px solid #d7dee7",
                                  borderRadius:
                                    "9px",
                                  padding:
                                    "9px 12px",
                                  background:
                                    "#fff",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        padding:
                          "11px 15px",
                        borderTop:
                          "1px solid #edf1f5",
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "6px",
                        fontSize: "9px",
                        color: "#98a2b3",
                      }}
                    >
                      <ShieldCheck
                        size={13}
                      />

                      Ansar Telecom Job
                      Record
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* =====================================================
            FINANCE
        ===================================================== */}

        <section className="rp-finance-strip">
          <div className="rp-finance-icon">
            <IndianRupee size={20} />
          </div>

          <div>
            <span>
              Estimated Repair Value
            </span>

            <strong>
              {formatCurrency(
                stats.totalRevenue
              )}
            </strong>
          </div>

          <p>
            Based on registered repair
            estimates.
          </p>
        </section>
      </div>

      {/* =====================================================
          NEW JOB
      ===================================================== */}

      <NewRepairJobModal
        isOpen={isNewJobModalOpen}
        onClose={() =>
          setIsNewJobModalOpen(false)
        }
        onCreateJob={handleCreateJob}
        technicians={assignableTechnicians}
      />
    </main>
  );
};

export default ReceptionPanel;