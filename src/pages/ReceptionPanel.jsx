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
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import NewRepairJobModal from "../components/NewRepairJobModal";
import LiveRiderTracker from "../components/LiveRiderTracker";
import ThermalReceiptModal from "../components/ThermalReceiptModal";

import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  Bike,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Copy,
  Edit3,
  ExternalLink,
  Headphones,
  IndianRupee,
  MapPin,
  MessageCircle,
  Navigation,
  PackageCheck,
  PauseCircle,
  Phone,
  PhoneCall,
  Plus,
  Printer,
  Radio,
  Route,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Truck,
  UserRoundCheck,
  UserRoundCog,
  Users,
  Wrench,
  X,
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

const formatDate = (value) => {
  const ms = timestampToMillis(value);
  if (!ms) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleDateString("en-IN");
  }
};

const formatAddress = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "object") {
    const parts = [
      val.address,
      val.landmark ? (String(val.landmark).toLowerCase().startsWith("near") ? val.landmark : `Near ${val.landmark}`) : "",
      val.city,
      val.pincode,
    ].filter(Boolean);
    return parts.join(", ") || "";
  }
  return String(val);
};

const getJobAddress = (job = {}) => {
  const addr =
    formatAddress(job.pickupAddress) ||
    formatAddress(job.customerAddress) ||
    formatAddress(job.address);
  if (addr) return addr;
  if (job.landmark && typeof job.landmark === "string") return `Near ${job.landmark}`;
  return "";
};

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
  const [riders, setRiders] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingTechs, setLoadingTechs] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pickDropFilterOnly, setPickDropFilterOnly] = useState(false);

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

  const [trackingJobId, setTrackingJobId] = useState(null);
  const [assignRiderDeliveryJobId, setAssignRiderDeliveryJobId] = useState(null);
  const [selectedDeliveryRiderId, setSelectedDeliveryRiderId] = useState("");
  const [deliveryRiderNotes, setDeliveryRiderNotes] = useState("");
  const [receiptJob, setReceiptJob] = useState(null);

  // Edit Job Modal State
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    landmark: "",
    brand: "",
    model: "",
    imei: "",
    passcode: "",
    issue: "",
    notes: "",
    estimatedCost: 0,
    receivedAmount: 0,
    isUrgent: false,
    repairStage: "Diagnosis",
    technicianId: "",
  });

  // Assign Technician Modal State
  const [assignTechJob, setAssignTechJob] = useState(null);
  const [selectedTechForAssign, setSelectedTechForAssign] = useState("");

  // Customer Tracking Share Modal State
  const [shareTrackingJob, setShareTrackingJob] = useState(null);
  const [copiedLinkToast, setCopiedLinkToast] = useState(false);

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
     REALTIME RIDERS
  ========================================================= */

  useEffect(() => {
    const ridersQuery = query(collection(db, "riders"));
    const unsubscribeRiders = onSnapshot(
      ridersQuery,
      (snapshot) => {
        const list = [];
        snapshot.forEach((item) => {
          list.push({
            id: item.id,
            ...item.data(),
          });
        });
        setRiders(list);
      },
      (err) => {
        console.warn("Riders snapshot notice:", err);
      }
    );

    return () => unsubscribeRiders();
  }, []);

  /* =========================================================
     ASSIGN RIDER FOR DOORSTEP DELIVERY
  ========================================================= */

  const handleAssignRiderForDelivery = async (job) => {
    if (!job?.id) return;
    setActionLoading(`assign-delivery-${job.id}`);
    setActionError("");

    try {
      const selectedRider = riders.find((r) => r.id === selectedDeliveryRiderId);
      const riderName = selectedRider?.name || selectedRider?.fullName || (selectedDeliveryRiderId ? "Assigned Rider" : "Any Available Rider");
      const riderPhone = selectedRider?.phone || selectedRider?.mobile || "";

      const totalAmt = getAmount(job);
      const recAmt = getReceivedAmount(job);
      const pendingBalance = Math.max(0, totalAmt - recAmt);

      // 1. Update or create pickupRequests entry for delivery
      const requestRef = doc(db, "pickupRequests", job.id);
      await setDoc(
        requestRef,
        {
          jobId: job.id,
          taskType: "delivery",
          status: "delivery_rider_assigned",
          deliveryRiderId: selectedDeliveryRiderId || "all_or_available",
          deliveryRiderName: riderName,
          deliveryRiderPhone: riderPhone,
          customerName: getCustomerName(job),
          customerPhone: getPhone(job),
          pickupAddress: getJobAddress(job),
          customerAddress: getJobAddress(job),
          landmark: typeof job.landmark === "string" ? job.landmark : "",
          deviceModel: getDevice(job),
          issue: getIssue(job) || "Doorstep Delivery after Repair",
          totalCost: totalAmt,
          receivedAmount: recAmt,
          pendingAmount: pendingBalance,
          balance: pendingBalance,
          notes: deliveryRiderNotes || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Update repairJobs entry
      await updateDoc(doc(db, "repairJobs", job.id), {
        riderStatus: "delivery_rider_assigned",
        deliveryRiderId: selectedDeliveryRiderId || "all_or_available",
        deliveryRiderName: riderName,
        deliveryRiderPhone: riderPhone,
        repairStage: "Ready",
        customerStatus: `Your device repair is complete and assigned to rider ${riderName} for doorstep delivery.`,
        customerStatusCode: "OUT_FOR_DELIVERY",
        deliveryInstructions: deliveryRiderNotes || "",
        updatedAt: serverTimestamp(),
      });

      setAssignRiderDeliveryJobId(null);
      setSelectedDeliveryRiderId("");
      setDeliveryRiderNotes("");
    } catch (err) {
      console.error("Assign delivery rider error:", err);
      setActionError("Unable to assign rider for delivery. Please try again.");
    } finally {
      setActionLoading("");
    }
  };

  /* =========================================================
     TECHNICIAN & JOB MANAGEMENT HANDLERS
  ========================================================= */

  const handleAssignTechnician = async (job, techId) => {
    if (!job?.id) return;
    setActionLoading(`assign-tech-${job.id}`);
    setActionError("");

    try {
      const selectedTech = technicians.find((t) => String(t.id) === String(techId));
      const techName = selectedTech ? getTechName(selectedTech) : "Unassigned";
      const assignedUid = selectedTech ? String(selectedTech.id) : "";

      const updates = {
        technician: techName,
        technicianName: techName,
        assignedTechnician: techName,
        assignedTo: techName,
        technicianId: assignedUid,
        technicianUid: assignedUid,
        assignedTechnicianId: assignedUid,
        assignedToId: assignedUid,
        assignedAt: assignedUid ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      };

      if (assignedUid) {
        if (!job.status || job.status === "Pending") {
          updates.status = "In Progress";
        }
        if (!job.repairStage || job.repairStage === "Device Received") {
          updates.repairStage = "Diagnosis";
        }
        updates.customerStatus = `Device assigned to technician ${techName}. Diagnosis & repair in progress.`;
        updates.customerStatusCode = "DIAGNOSIS";
      } else {
        updates.customerStatus = "Device awaiting technician assignment at reception.";
      }

      await updateDoc(doc(db, "repairJobs", job.id), updates);

      // Also sync to pickupRequests if available
      try {
        await updateDoc(doc(db, "pickupRequests", job.id), {
          technicianName: techName,
          updatedAt: serverTimestamp(),
        });
      } catch (_) {}

      setAssignTechJob(null);
      setSelectedTechForAssign("");
    } catch (err) {
      console.error("Assign technician error:", err);
      setActionError("Unable to assign technician. Please try again.");
    } finally {
      setActionLoading("");
    }
  };

  const openAssignTech = (job) => {
    setAssignTechJob(job);
    const currentTechId =
      job.technicianId ||
      job.assignedTechnicianId ||
      job.technicianUid ||
      "";
    setSelectedTechForAssign(currentTechId);
    setActionError("");
  };

  const openEditJob = (job) => {
    setEditingJob(job);
    setEditFormData({
      customerName: getCustomerName(job),
      customerPhone: getPhone(job),
      deliveryAddress: getJobAddress(job),
      landmark: typeof job.landmark === "string" ? job.landmark : "",
      brand: job.brand || "",
      model: job.model || "",
      imei: job.imei || job.imeiNumber || "",
      passcode: job.passcode || job.devicePassword || "",
      issue: getIssue(job),
      notes: job.notes || job.issueNotes || "",
      estimatedCost: getAmount(job),
      receivedAmount: getReceivedAmount(job),
      isUrgent: Boolean(job.isUrgent),
      repairStage: getRepairStage(job),
      technicianId:
        job.technicianId ||
        job.assignedTechnicianId ||
        job.technicianUid ||
        "",
    });
    setActionError("");
  };

  const handleSaveEditJob = async (e) => {
    if (e) e.preventDefault();
    if (!editingJob?.id) return;

    setActionLoading(`save-edit-${editingJob.id}`);
    setActionError("");

    try {
      const totalCost = Number(editFormData.estimatedCost) || 0;
      const advancePaid = Number(editFormData.receivedAmount) || 0;
      const pendingBalance = Math.max(0, totalCost - advancePaid);

      const selectedTech = technicians.find(
        (t) => String(t.id) === String(editFormData.technicianId)
      );
      const techName = selectedTech
        ? getTechName(selectedTech)
        : editFormData.technicianId
        ? "Technician"
        : "Unassigned";
      const techUid = selectedTech ? String(selectedTech.id) : "";

      const updates = {
        customerName: editFormData.customerName.trim(),
        customerPhone: editFormData.customerPhone.trim(),
        phone: editFormData.customerPhone.trim(),
        brand: editFormData.brand.trim(),
        model: editFormData.model.trim(),
        deviceModel: `${editFormData.brand.trim()} ${editFormData.model.trim()}`.trim(),
        imei: editFormData.imei.trim(),
        passcode: editFormData.passcode.trim(),
        issue: editFormData.issue.trim(),
        issueDescription: editFormData.issue.trim(),
        notes: editFormData.notes.trim(),
        estimatedCost: totalCost,
        amount: totalCost,
        totalCost: totalCost,
        receivedAmount: advancePaid,
        paidAmount: advancePaid,
        advance: advancePaid,
        balance: pendingBalance,
        isUrgent: Boolean(editFormData.isUrgent),
        priority: editFormData.isUrgent ? "Urgent" : "Normal",
        repairStage: editFormData.repairStage,
        status:
          editFormData.repairStage === "Ready"
            ? "Ready"
            : editFormData.repairStage === "Delivered"
            ? "Completed"
            : "In Progress",
        technician: techName,
        technicianName: techName,
        assignedTechnician: techName,
        assignedTo: techName,
        technicianId: techUid,
        technicianUid: techUid,
        assignedTechnicianId: techUid,
        assignedToId: techUid,
        pickupAddress: editFormData.deliveryAddress.trim(),
        customerAddress: editFormData.deliveryAddress.trim(),
        landmark: editFormData.landmark.trim(),
        updatedAt: serverTimestamp(),
      };

      if (techUid && !editingJob.technicianId) {
        updates.assignedAt = serverTimestamp();
      }

      // Stage change customer status update
      if (editFormData.repairStage !== getRepairStage(editingJob)) {
        if (editFormData.repairStage === "Ready") {
          updates.customerStatus =
            "Your device repair is complete and ready for collection or doorstep delivery.";
          updates.customerStatusCode = "READY";
          updates.readyAt = serverTimestamp();
        } else if (editFormData.repairStage === "Delivered") {
          updates.customerStatus = "Your device has been delivered successfully.";
          updates.customerStatusCode = "DELIVERED";
        } else if (editFormData.repairStage === "Waiting Customer Approval") {
          updates.customerStatus =
            "Repair estimate shared. Awaiting customer confirmation.";
          updates.customerStatusCode = "WAITING_APPROVAL";
        } else if (editFormData.repairStage === "Waiting Part") {
          updates.customerStatus =
            "Waiting for required spare parts to arrive. Repair will resume shortly.";
          updates.customerStatusCode = "WAITING_PART";
        } else if (editFormData.repairStage === "Diagnosis") {
          updates.customerStatus =
            techName !== "Unassigned"
              ? `Technician ${techName} is performing initial diagnostics.`
              : "Device received at shop. Diagnosis will begin shortly.";
          updates.customerStatusCode = "DIAGNOSIS";
        } else if (editFormData.repairStage === "Repair In Progress") {
          updates.customerStatus =
            techName !== "Unassigned"
              ? `Technician ${techName} is actively repairing your device.`
              : "Device repair is currently in progress.";
          updates.customerStatusCode = "REPAIR_IN_PROGRESS";
        }
      }

      await updateDoc(doc(db, "repairJobs", editingJob.id), updates);

      // Also update pickupRequests for sync
      try {
        await setDoc(
          doc(db, "pickupRequests", editingJob.id),
          {
            customerName: editFormData.customerName.trim(),
            customerPhone: editFormData.customerPhone.trim(),
            pickupAddress: editFormData.deliveryAddress.trim(),
            landmark: editFormData.landmark.trim(),
            deviceModel: `${editFormData.brand.trim()} ${editFormData.model.trim()}`.trim(),
            issue: editFormData.issue.trim(),
            totalCost: totalCost,
            receivedAmount: advancePaid,
            pendingAmount: pendingBalance,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (_) {}

      setEditingJob(null);
    } catch (err) {
      console.error("Save edit job error:", err);
      setActionError("Failed to save changes. Please try again.");
    } finally {
      setActionLoading("");
    }
  };

  const handleQuickMarkReady = async (job) => {
    if (!job?.id) return;
    setActionLoading(`mark-ready-${job.id}`);
    setActionError("");

    try {
      await updateDoc(doc(db, "repairJobs", job.id), {
        repairStage: "Ready",
        status: "Ready",
        customerStatus:
          "Your device repair is complete and ready for doorstep delivery or shop collection.",
        customerStatusCode: "READY",
        readyAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // If doorstep job, open the rider dispatch modal directly
      if (job.source === "pick_and_drop" || Boolean(job.isPickDrop) || Boolean(job.pickupId)) {
        setAssignRiderDeliveryJobId(job.id);
      }
    } catch (err) {
      console.error("Mark ready error:", err);
      setActionError("Failed to update status to Ready.");
    } finally {
      setActionLoading("");
    }
  };

  const openShareTracking = (job) => {
    setShareTrackingJob(job);
    setCopiedLinkToast(false);
  };

  const handleCopyTrackingLink = (url) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedLinkToast(true);
      setTimeout(() => setCopiedLinkToast(false), 3000);
    }
  };

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

      let createdJobId = "";

      await runTransaction(db, async (transaction) => {
        const counterDoc =
          await transaction.get(counterRef);

        let nextNumber = 1049;

        if (counterDoc.exists()) {
          nextNumber =
            toNumber(counterDoc.data().lastNumber || 1048) + 1;
        }

        const newJobId = `AT-${nextNumber}`;
        createdJobId = newJobId;

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

      return createdJobId || true;
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
    if (!job?.id) return;

    const total = getAmount(job);
    const alreadyReceived = getReceivedAmount(job);
    const receivedNow = Math.max(0, toNumber(deliveryPayment));

    if (receivedNow > Math.max(0, total - alreadyReceived)) {
      setActionError("Received amount cannot be more than pending balance.");
      return;
    }

    const newReceived = alreadyReceived + receivedNow;
    const balance = Math.max(0, total - newReceived);

    try {
      setActionError("");
      setActionLoading(`delivery-${job.id}`);

      const nowIso = new Date().toISOString();

      const updateData = {
        status: "Completed",
        repairStage: REPAIR_STAGES.DELIVERED,
        customerStatus: "Your device has been delivered successfully. Thank you for choosing Ansar Telecom!",
        customerStatusCode: "DELIVERED",
        amount: total,
        totalAmount: total,
        receivedAmount: newReceived,
        paidAmount: newReceived,
        balanceAmount: balance,
        paymentStatus:
          balance <= 0
            ? "Paid"
            : newReceived > 0
            ? "Partial"
            : "Pending",
        paymentMethod:
          receivedNow > 0
            ? deliveryPaymentMethod
            : job.paymentMethod || "Cash",
        lastPaymentAmount: receivedNow,
        lastPaymentAt:
          receivedNow > 0
            ? serverTimestamp()
            : job.lastPaymentAt || null,
        delivery: {
          ...(job.delivery || {}),
          status: "Delivered",
          method: deliveryMethod,
          deliveredAt: nowIso,
          deliveredBy: "Reception",
          notes: deliveryNotes.trim(),
        },
        deliveredAt: serverTimestamp(),
        deliveredBy: "Reception",
        deliveryMethod,
        completedAt: job.completedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        riderStatus: "delivered",
        taskType: "delivery_completed",
        jobHistory: arrayUnion({
          action: "Device Delivered",
          stage: REPAIR_STAGES.DELIVERED,
          timestamp: nowIso,
          note: `Delivered via ${deliveryMethod}. Payment collected: ₹${receivedNow}. Pending balance: ₹${balance}. ${deliveryNotes.trim() ? `Notes: ${deliveryNotes.trim()}` : ""}`.trim(),
          updatedBy: "Reception",
        }),
      };

      await updateDoc(doc(db, "repairJobs", job.id), updateData);

      // Sync linked doorstep pickup request if present
      const pickupBookingId = job.pickupRequestId || job.doorstepBookingId || job.pickupId;
      if (pickupBookingId) {
        try {
          await updateDoc(doc(db, "pickupRequests", pickupBookingId), {
            status: "delivered",
            deliveryCompletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (pickupErr) {
          console.warn("Linked pickup request update notice:", pickupErr);
        }
      }

      closeDelivery();
    } catch (error) {
      console.error("Delivery error:", error);
      setActionError(
        error?.message || "Unable to deliver device. Please check connection and try again."
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
        } else if (statusFilter === "Pick & Drop") {
          matchesStatus =
            job.source === "pick_and_drop" ||
            Boolean(job.isPickDrop) ||
            Boolean(job.pickupId) ||
            Boolean(job.riderStatus);
        } else {
          matchesStatus =
            job.status === statusFilter ||
            stage === statusFilter;
        }
      }

      if (pickDropFilterOnly) {
        const isPickDrop =
          job.source === "pick_and_drop" ||
          Boolean(job.isPickDrop) ||
          Boolean(job.pickupId) ||
          Boolean(job.riderStatus);
        if (!isPickDrop) return false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter, pickDropFilterOnly]);

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

  const pickDropJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job?.source === "pick_and_drop" ||
          Boolean(job?.isPickDrop) ||
          Boolean(job?.pickupId) ||
          Boolean(job?.riderStatus)
      ),
    [jobs]
  );

  const getStageBadgeClass = (stg) => {
    const norm = normalizeText(stg);
    if (norm.includes("ready")) return "rp-stage-ready";
    if (norm.includes("deliver")) return "rp-stage-delivered";
    if (norm.includes("progress") || norm.includes("repairing") || norm.includes("testing")) return "rp-stage-progress";
    if (norm.includes("approval")) return "rp-stage-approval";
    if (norm.includes("part")) return "rp-stage-part";
    return "rp-stage-default";
  };

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
    <main className="rp-page">
      <div className="rp-shell">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="rp-hero">
          <div className="rp-hero-glow" />
          <div className="rp-hero-content">
            <span className="rp-eyebrow">
              <Sparkles size={14} />
              ANSAR TELECOM • RECEPTION
            </span>

            <h1>
              Reception <span>Control Center</span>
            </h1>

            <p>
              Book devices, monitor workbench progress, handle customer approvals,
              manage technician transfers and confirm final customer delivery.
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
            STATS (CLICKABLE QUICK FILTERS)
        ===================================================== */}

        <section className="rp-stats-grid">
          <button
            type="button"
            className={`rp-stat-card ${statusFilter === "Pending" ? "is-active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Pending" ? "All" : "Pending")}
          >
            <div className="rp-stat-head">
              <div className="rp-stat-icon rp-icon-pending">
                <CircleDot size={18} />
              </div>
              <span className="rp-stat-badge">Awaiting</span>
            </div>
            <span className="rp-stat-label">Pending</span>
            <strong className="rp-stat-val">{stats.pending}</strong>
            <small className="rp-stat-sub">Waiting for tech assignment</small>
          </button>

          <button
            type="button"
            className={`rp-stat-card ${statusFilter === "In Progress" ? "is-active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "In Progress" ? "All" : "In Progress")}
          >
            <div className="rp-stat-head">
              <div className="rp-stat-icon rp-icon-progress">
                <Activity size={18} />
              </div>
              <span className="rp-stat-badge">Active</span>
            </div>
            <span className="rp-stat-label">In Progress</span>
            <strong className="rp-stat-val">{stats.active}</strong>
            <small className="rp-stat-sub">Under active bench repair</small>
          </button>

          <button
            type="button"
            className={`rp-stat-card ${statusFilter === "Waiting Customer Approval" ? "is-active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Waiting Customer Approval" ? "All" : "Waiting Customer Approval")}
          >
            <div className="rp-stat-head">
              <div className="rp-stat-icon rp-icon-approval">
                <AlertCircle size={18} />
              </div>
              <span className="rp-stat-badge">Required</span>
            </div>
            <span className="rp-stat-label">Approval</span>
            <strong className="rp-stat-val">{stats.approval}</strong>
            <small className="rp-stat-sub">Customer approval pending</small>
          </button>

          <button
            type="button"
            className={`rp-stat-card ${statusFilter === "Transfer Requests" ? "is-active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Transfer Requests" ? "All" : "Transfer Requests")}
          >
            <div className="rp-stat-head">
              <div className="rp-stat-icon rp-icon-transfer">
                <ArrowRightLeft size={18} />
              </div>
              <span className="rp-stat-badge">Reassign</span>
            </div>
            <span className="rp-stat-label">Transfers</span>
            <strong className="rp-stat-val">{stats.transfers}</strong>
            <small className="rp-stat-sub">Tech transfer requests</small>
          </button>

          <button
            type="button"
            className={`rp-stat-card ${statusFilter === "Ready" ? "is-active" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "Ready" ? "All" : "Ready")}
          >
            <div className="rp-stat-head">
              <div className="rp-stat-icon rp-icon-ready">
                <CheckCircle2 size={18} />
              </div>
              <span className="rp-stat-badge">Handover</span>
            </div>
            <span className="rp-stat-label">Ready for Delivery</span>
            <strong className="rp-stat-val">{stats.ready}</strong>
            <small className="rp-stat-sub">Ready for customer delivery</small>
          </button>
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
            PICK & DROP LIVE NOTIFICATIONS
        ===================================================== */}
        {pickDropJobs.length > 0 && (
          <section
            className="rp-section-card"
            style={{
              marginBottom: "16px",
              borderLeft: "4px solid #10b981",
              background: "linear-gradient(to right, #f0fdf4, #ffffff)",
            }}
          >
            <div
              className="rp-section-heading"
              style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "#dcfce7",
                    color: "#15803d",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Bike size={22} />
                </div>
                <div>
                  <span className="rp-section-kicker" style={{ color: "#15803d" }}>
                    ONLINE DOORSTEP DISPATCH
                  </span>
                  <h2 style={{ fontSize: "16px", margin: "2px 0 3px" }}>
                    Pick & Drop Service Live ({pickDropJobs.length} Bookings)
                  </h2>
                  <p style={{ margin: 0, fontSize: "11px", color: "#475569" }}>
                    Customer doorstep pickup and delivery requests with live rider GPS tracking.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setPickDropFilterOnly(!pickDropFilterOnly);
                    if (!pickDropFilterOnly) setStatusFilter("All");
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "9px",
                    border: pickDropFilterOnly ? "1px solid #16a34a" : "1px solid #cbd5e1",
                    background: pickDropFilterOnly ? "#16a34a" : "#fff",
                    color: pickDropFilterOnly ? "#fff" : "#1e293b",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Radio size={13} />
                  {pickDropFilterOnly ? "Showing Pick & Drop Only" : "Filter Pick & Drop Jobs"}
                </button>
              </div>
            </div>
          </section>
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
              const request = job.transferRequest || {};

              return (
                <div key={`transfer-${job.id}`} className="rp-attention-item">
                  <div className="rp-attention-head">
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#7c3aed" }}>
                        TRANSFER REQUEST • {job.id}
                      </span>

                      <h3 style={{ margin: "4px 0 2px", fontSize: "15px", fontWeight: 800 }}>
                        {getDevice(job)}
                      </h3>

                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                        From: <strong>{request.requestedByName || getTechnicianName(job)}</strong> → To:{" "}
                        <strong style={{ color: "#2563eb" }}>{request.targetTechnicianName || "Technician"}</strong>
                      </p>
                    </div>

                    <ArrowRightLeft size={20} color="#7c3aed" />
                  </div>

                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      fontSize: "11px",
                    }}
                  >
                    <strong>Reason:</strong> {request.reason || "No reason provided."}
                  </div>

                  <div className="rp-attention-btn-group">
                    <button
                      type="button"
                      className="rp-btn-success"
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleTransferRequest(job, true)}
                    >
                      <CheckCircle2 size={13} />
                      {actionLoading === `transfer-approve-${job.id}`
                        ? "Approving..."
                        : "Approve Transfer"}
                    </button>

                    <button
                      type="button"
                      className="rp-btn-danger"
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleTransferRequest(job, false)}
                    >
                      <XCircle size={13} />
                      {actionLoading === `transfer-reject-${job.id}`
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* WAITING CUSTOMER APPROVAL JOBS */}
            {waitingApprovalJobs.map((job) => (
              <div key={`approval-${job.id}`} className="rp-attention-item">
                <div className="rp-attention-head">
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#e11d48" }}>
                      CUSTOMER APPROVAL REQUIRED • {job.id}
                    </span>

                    <h3 style={{ margin: "4px 0 2px", fontSize: "15px", fontWeight: 800 }}>
                      {getDevice(job)}
                    </h3>

                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                      Customer: <strong>{getCustomerName(job)}</strong> • Phone:{" "}
                      <a href={`tel:${getPhone(job)}`} style={{ color: "#2563eb", fontWeight: 600 }}>
                        {getPhone(job)}
                      </a>
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", color: "#64748b", display: "block", textTransform: "uppercase" }}>
                      Cost Estimate
                    </span>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                      {formatCurrency(getAmount(job))}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                  }}
                >
                  <strong>Reported Issue:</strong> {getIssue(job)}
                </div>

                <div className="rp-attention-btn-group">
                  <button
                    type="button"
                    className="rp-btn-success"
                    disabled={Boolean(actionLoading)}
                    onClick={() => handleApproveRepair(job)}
                  >
                    <CheckCircle2 size={13} />
                    {actionLoading === `approve-${job.id}` ? "Saving..." : "Customer Approved"}
                  </button>

                  <button
                    type="button"
                    className="rp-btn-danger"
                    disabled={Boolean(actionLoading)}
                    onClick={() => {
                      setRejectJobId(job.id);
                      setRejectionReason("");
                    }}
                  >
                    <XCircle size={13} />
                    Customer Rejected
                  </button>
                </div>
              </div>
            ))}
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

          <div className="rp-controls-bar">
            <div className="rp-search-box">
              <Search size={15} className="rp-search-icon" />

              <input
                className="rp-search-input"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search by Job ID, customer, phone, device model, issue..."
              />
            </div>

            <select
              className="rp-filter-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option>All</option>
              <option>Pick & Drop</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Paused</option>
              <option>Ready</option>
              <option>Completed</option>
              <option>Returned</option>
              <option>Waiting Customer Approval</option>
              <option>Waiting Part</option>
              <option>Testing</option>
              <option>Transfer Requests</option>
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

                const isReadyForDelivery = ready || stage === REPAIR_STAGES.READY || job.status === "Ready";
                const isDelivered = stage === REPAIR_STAGES.DELIVERED || job.status === "Completed";
                const cardModifier = isReadyForDelivery ? "is-ready" : isDelivered ? "is-delivered" : waitingApproval ? "is-waiting" : transferPending ? "is-transfer" : "";

                return (
                  <article key={job.id} className={`rp-job-card ${cardModifier}`}>
                    <div className="rp-job-top">
                      <div className="rp-job-header-left">
                        <div className="rp-job-meta-row">
                          <span className="rp-job-id-tag">
                            <Tag size={11} />
                            {job.id}
                          </span>
                          {(job.source === "pick_and_drop" || Boolean(job.isPickDrop)) && (
                            <span className="rp-job-source-tag">
                              <Bike size={11} /> Doorstep
                            </span>
                          )}
                          {job.isUrgent && (
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#e11d48", background: "#ffe4e6", padding: "2px 6px", borderRadius: "4px" }}>
                              URGENT
                            </span>
                          )}
                        </div>

                        <h3 className="rp-job-title">{getDevice(job)}</h3>

                        <p className="rp-job-customer-line">
                          <span>{getCustomerName(job)}</span>
                          <span>•</span>
                          <a href={`tel:${getPhone(job)}`} className="rp-job-phone-link">
                            <PhoneCall size={11} />
                            {getPhone(job)}
                          </a>
                        </p>
                      </div>

                      <div className={`rp-stage-badge ${getStageBadgeClass(stage)}`}>
                        <span className="rp-stage-dot" />
                        {stage}
                      </div>
                    </div>

                    <div className="rp-job-specs">
                      <div className="rp-spec-item">
                        <span className="rp-spec-lbl">PROBLEM / ISSUE</span>
                        <strong className="rp-spec-val" style={{ color: "#0f172a" }}>
                          {getIssue(job)}
                        </strong>
                      </div>

                      <div className="rp-spec-item">
                        <span className="rp-spec-lbl">ASSIGNED TECHNICIAN</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                          <strong
                            className="rp-spec-val"
                            style={{
                              color: getTechnicianName(job) === "Unassigned" ? "#d97706" : "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            {getTechnicianName(job)}
                          </strong>
                          <button
                            type="button"
                            onClick={() => openAssignTech(job)}
                            style={{
                              border: "none",
                              background: getTechnicianName(job) === "Unassigned" ? "#fef3c7" : "#eff6ff",
                              color: getTechnicianName(job) === "Unassigned" ? "#b45309" : "#1d4ed8",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                            title="Assign or change technician"
                          >
                            <UserRoundCog size={11} />
                            {getTechnicianName(job) === "Unassigned" ? "+ Assign" : "Change"}
                          </button>
                        </div>
                      </div>

                      <div className="rp-spec-item">
                        <span className="rp-spec-lbl">TOTAL ESTIMATE</span>
                        <strong className="rp-spec-val" style={{ color: "#0f172a", fontWeight: 800 }}>
                          {formatCurrency(amount)}
                        </strong>
                      </div>

                      <div className="rp-spec-item">
                        <span className="rp-spec-lbl">PENDING BALANCE</span>
                        <strong className="rp-spec-val" style={{ color: balance > 0 ? "#e11d48" : "#16a34a", fontWeight: 800 }}>
                          {formatCurrency(balance)}
                        </strong>
                      </div>
                    </div>

                    {/* PRIMARY ACTION BAR FOR RECEPTION & OWNER */}
                    <div className="rp-job-actions-toolbar">
                      <button
                        type="button"
                        className="rp-action-btn rp-action-btn-edit"
                        onClick={() => openEditJob(job)}
                        title="Edit Device specs, problem, estimate, and customer details"
                      >
                        <Edit3 size={13} />
                        Edit Job
                      </button>

                      <button
                        type="button"
                        className="rp-action-btn rp-action-btn-tech"
                        onClick={() => openAssignTech(job)}
                        title="Assign or reassign technician"
                      >
                        <UserRoundCog size={13} />
                        {getTechnicianName(job) === "Unassigned" ? "Assign Tech" : "Change Tech"}
                      </button>

                      {!isReadyForDelivery && !isDelivered && (
                        <button
                          type="button"
                          className="rp-action-btn rp-action-btn-ready"
                          disabled={Boolean(actionLoading)}
                          onClick={() => handleQuickMarkReady(job)}
                          title="Mark device repair as Ready"
                        >
                          <CheckCircle2 size={13} />
                          {actionLoading === `mark-ready-${job.id}` ? "Updating..." : "Mark Ready"}
                        </button>
                      )}

                      {(job.source === "pick_and_drop" || Boolean(job.isPickDrop) || isReadyForDelivery) && (
                        <button
                          type="button"
                          className="rp-action-btn rp-action-btn-rider"
                          onClick={() => setAssignRiderDeliveryJobId(job.id)}
                          title="Dispatch rider for home delivery"
                        >
                          <Bike size={13} />
                          {job.deliveryRiderName ? "Delivery Rider" : "Home Delivery"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="rp-action-btn rp-action-btn-share"
                        onClick={() => openShareTracking(job)}
                        title="Share live repair and delivery tracking with customer"
                      >
                        <Share2 size={13} />
                        Customer Tracking
                      </button>

                      <button
                        type="button"
                        className="rp-action-btn rp-action-btn-print"
                        onClick={() => setReceiptJob(job)}
                        title="Print Thermal Receipt / Device Tag"
                      >
                        <Printer size={13} />
                        Print Tag
                      </button>
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

                    {/* DOORSTEP PICK & DROP DETAILS & LIVE TRACKING */}
                    {(job.source === "pick_and_drop" ||
                      Boolean(job.isPickDrop) ||
                      Boolean(job.pickupId) ||
                      Boolean(job.riderStatus)) && (
                      <div
                        style={{
                          margin: "0 15px 15px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          border: "1px solid #bbf7d0",
                          background: "#f0fdf4",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Bike size={16} style={{ color: "#16a34a" }} />
                            <strong style={{ fontSize: "12px", color: "#15803d" }}>
                              Doorstep Pick & Drop Service
                            </strong>
                          </div>

                          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "#dcfce7",
                                color: "#166534",
                                textTransform: "capitalize",
                              }}
                            >
                              {(job.riderStatus || "Awaiting Rider").replace(/_/g, " ")}
                            </span>

                            <button
                              type="button"
                              onClick={() => setTrackingJobId(job.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 10px",
                                borderRadius: "7px",
                                background: "#16a34a",
                                color: "#fff",
                                border: "none",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <Route size={12} />
                              Track Live Rider
                            </button>

                            <button
                              type="button"
                              onClick={() => setAssignRiderDeliveryJobId(job.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 10px",
                                borderRadius: "7px",
                                background: "#059669",
                                color: "#fff",
                                border: "none",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              title="Assign rider for doorstep delivery"
                            >
                              <Bike size={12} />
                              {job.riderStatus === "delivery_rider_assigned" || job.deliveryRiderName
                                ? "Reassign Delivery"
                                : "Dispatch Home Delivery"}
                            </button>

                            <button
                              type="button"
                              onClick={() => openShareTracking(job)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "5px 10px",
                                borderRadius: "7px",
                                background: "#ffffff",
                                color: "#16a34a",
                                border: "1px solid #bbf7d0",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              title="Share customer tracking link"
                            >
                              <Share2 size={12} />
                              Share Tracking
                            </button>
                          </div>
                        </div>

                        {Boolean(getJobAddress(job)) && (
                          <p
                            style={{
                              margin: "4px 0 2px",
                              fontSize: "11px",
                              color: "#334155",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "5px",
                            }}
                          >
                            <MapPin size={13} style={{ flexShrink: 0, marginTop: "2px", color: "#16a34a" }} />
                            <span>
                              <strong>Address:</strong> {getJobAddress(job)}
                            </span>
                          </p>
                        )}

                        {(job.assignedRiderName || job.deliveryRiderName) && (
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: "11px",
                              color: "#475569",
                            }}
                          >
                            <strong>Rider:</strong> {job.deliveryRiderName || job.assignedRiderName}
                            {(job.deliveryRiderPhone || job.assignedRiderPhone) && ` (${job.deliveryRiderPhone || job.assignedRiderPhone})`}
                          </p>
                        )}
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
                      <div className="rp-delivery-box">
                        <div className="rp-delivery-box-head">
                          <PackageCheck size={18} color="#059669" />
                          <div>
                            <strong style={{ fontSize: "13px", color: "#065f46", display: "block" }}>
                              Repair Finished • Ready for Delivery
                            </strong>
                            <span style={{ fontSize: "11px", color: "#047857" }}>
                              Verify pending balance and confirm handover to customer or dispatch rider.
                            </span>
                          </div>
                        </div>

                        <div className="rp-delivery-actions">
                          <button
                            type="button"
                            className="rp-btn-confirm-delivery"
                            onClick={() => openDelivery(job)}
                          >
                            <PackageCheck size={14} />
                            {deliveryJobId === job.id ? "Editing Delivery Details..." : "Deliver Device"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setAssignRiderDeliveryJobId(job.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: "1px solid #10b981",
                              background: "#ffffff",
                              color: "#047857",
                              fontWeight: 700,
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            <Bike size={14} />
                            Dispatch Doorstep Rider
                          </button>
                        </div>

                        {deliveryJobId === job.id && (
                          <div className="rp-delivery-form">
                            <div className="rp-delivery-chips">
                              <div className="rp-delivery-chip">
                                <span>TOTAL AMOUNT</span>
                                <strong>{formatCurrency(amount)}</strong>
                              </div>
                              <div className="rp-delivery-chip">
                                <span>ALREADY RECEIVED</span>
                                <strong style={{ color: "#16a34a" }}>{formatCurrency(received)}</strong>
                              </div>
                              <div className="rp-delivery-chip">
                                <span>PENDING BALANCE</span>
                                <strong style={{ color: balance > 0 ? "#e11d48" : "#16a34a" }}>
                                  {formatCurrency(balance)}
                                </strong>
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                                  Payment Received Now (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  className="rp-delivery-input"
                                  value={deliveryPayment}
                                  onChange={(event) => setDeliveryPayment(event.target.value)}
                                  placeholder="0"
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                                  Payment Method
                                </label>
                                <select
                                  className="rp-delivery-select"
                                  value={deliveryPaymentMethod}
                                  onChange={(event) => setDeliveryPaymentMethod(event.target.value)}
                                >
                                  <option>Cash</option>
                                  <option>UPI</option>
                                  <option>Card</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                                  Handover Method
                                </label>
                                <select
                                  className="rp-delivery-select"
                                  value={deliveryMethod}
                                  onChange={(event) => setDeliveryMethod(event.target.value)}
                                >
                                  <option>Customer Pickup</option>
                                  <option>Home Delivery</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>
                                Delivery Remarks / Notes
                              </label>
                              <textarea
                                className="rp-delivery-textarea"
                                value={deliveryNotes}
                                onChange={(event) => setDeliveryNotes(event.target.value)}
                                placeholder="Optional notes for invoice / customer record..."
                              />
                            </div>

                            <div className="rp-delivery-actions">
                              <button
                                type="button"
                                className="rp-btn-confirm-delivery"
                                disabled={Boolean(actionLoading)}
                                onClick={() => handleDeliverJob(job)}
                              >
                                <CheckCircle2 size={14} />
                                {actionLoading === `delivery-${job.id}`
                                  ? "Saving Delivery..."
                                  : "Confirm Delivery & Close Job"}
                              </button>

                              <button
                                type="button"
                                className="rp-btn-cancel"
                                onClick={closeDelivery}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ALREADY DELIVERED BANNER */}
                    {(stage === REPAIR_STAGES.DELIVERED || job.status === "Completed") && (
                      <div
                        style={{
                          margin: "0 15px 15px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <CheckCircle2 size={16} color="#059669" />
                          <div>
                            <strong style={{ fontSize: "12px", color: "#065f46" }}>
                              Delivered to Customer
                            </strong>
                            <span style={{ display: "block", fontSize: "11px", color: "#047857" }}>
                              {job.delivery?.method || job.deliveryMethod || "Customer Handover"}
                              {job.deliveredAt ? ` • ${formatDate(job.deliveredAt)}` : ""}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="rp-print-btn"
                          onClick={() => setReceiptJob(job)}
                        >
                          <Printer size={12} />
                          Print Receipt
                        </button>
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

      {/* =====================================================
          LIVE RIDER TRACKER MODAL
      ===================================================== */}
      {trackingJobId && (
        <LiveRiderTracker
          jobId={trackingJobId}
          isModal={true}
          onClose={() => setTrackingJobId(null)}
        />
      )}

      {/* =====================================================
          DISPATCH RIDER FOR DOORSTEP DELIVERY MODAL
      ===================================================== */}
      {assignRiderDeliveryJobId && (() => {
        const targetJob = jobs.find((j) => j.id === assignRiderDeliveryJobId);
        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "520px",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "#dcfce7",
                      color: "#16a34a",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Bike size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Dispatch Delivery Rider</h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                      Job #{assignRiderDeliveryJobId} • {getCustomerName(targetJob)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Details Summary */}
              <div style={{ padding: "12px 14px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#166534" }}>
                  <strong>Device:</strong> {getDevice(targetJob)}
                </p>
                <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#166534" }}>
                  <strong>Customer:</strong> {getCustomerName(targetJob)} ({getPhone(targetJob)})
                </p>
                {Boolean(getJobAddress(targetJob)) && (
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#166534" }}>
                    <strong>Delivery Address:</strong> {getJobAddress(targetJob)}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Amount to Collect (COD):</span>
                  <strong style={{ fontSize: "14px", color: (getAmount(targetJob) - getReceivedAmount(targetJob)) > 0 ? "#e11d48" : "#16a34a", fontWeight: 800 }}>
                    {formatCurrency(Math.max(0, getAmount(targetJob) - getReceivedAmount(targetJob)))}
                  </strong>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#334155" }}>
                  Select Rider for Delivery
                </label>
                <select
                  value={selectedDeliveryRiderId}
                  onChange={(e) => setSelectedDeliveryRiderId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                  }}
                >
                  <option value="">Broadcast to All Available Riders</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.fullName || r.id} {r.phone ? `(${r.phone})` : ""} {r.status ? `• ${r.status}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#334155" }}>
                  Delivery Instructions / Notes for Rider
                </label>
                <textarea
                  value={deliveryRiderNotes}
                  onChange={(e) => setDeliveryRiderNotes(e.target.value)}
                  placeholder="e.g. Call customer upon reaching, hand over safely with printed invoice"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setAssignRiderDeliveryJobId(null);
                    setSelectedDeliveryRiderId("");
                    setDeliveryRiderNotes("");
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignRiderForDelivery(targetJob)}
                  disabled={Boolean(actionLoading)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Truck size={15} />
                  {actionLoading ? "Dispatching..." : "Confirm Dispatch"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ASSIGN TECHNICIAN MODAL */}
      {Boolean(assignTechJob) && (
        <div className="rp-modal-overlay" onClick={() => setAssignTechJob(null)}>
          <div className="rp-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="rp-modal-head">
              <div className="rp-modal-title-row">
                <div className="rp-modal-icon-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <UserRoundCog size={20} />
                </div>
                <div>
                  <h3>Assign Technician</h3>
                  <p>Job #{assignTechJob.id} • {getDevice(assignTechJob)}</p>
                </div>
              </div>
              <button type="button" className="rp-modal-close-btn" onClick={() => setAssignTechJob(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="rp-modal-body">
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569" }}>
                  <span><strong>Customer:</strong> {getCustomerName(assignTechJob)}</span>
                  <span><strong>Issue:</strong> {getIssue(assignTechJob)}</span>
                </div>
                <div style={{ marginTop: "4px", fontSize: "12px", color: "#475569" }}>
                  <span><strong>Current Technician:</strong> {getTechnicianName(assignTechJob)}</span>
                </div>
              </div>

              <span className="rp-form-section-title">Select Technician</span>

              {/* Unassigned Option */}
              <div
                className={`rp-tech-assign-card ${!selectedTechForAssign ? "is-selected" : ""}`}
                onClick={() => setSelectedTechForAssign("")}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>Unassigned</strong>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Keep in reception queue without technician</span>
                </div>
                {!selectedTechForAssign && (
                  <span style={{ background: "#2563eb", color: "#fff", borderRadius: "999px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
                    Selected
                  </span>
                )}
              </div>

              {/* Technician list */}
              {technicians.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", margin: "20px 0" }}>No technicians registered yet.</p>
              ) : (
                technicians.map((tech) => {
                  const techId = String(tech.id);
                  const isSelected = selectedTechForAssign === techId;
                  const name = getTechName(tech);
                  const activeCount = jobs.filter((j) => isJobAssignedToTech(j, tech) && j.repairStage !== "Delivered" && j.repairStage !== "Cancelled").length;

                  return (
                    <div
                      key={tech.id}
                      className={`rp-tech-assign-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedTechForAssign(techId)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: isSelected ? "#2563eb" : "#e2e8f0",
                            color: isSelected ? "#ffffff" : "#334155",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: "13px",
                          }}
                        >
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>
                            {name} {tech.phone ? `(${tech.phone})` : ""}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {tech.specialization || "Mobile Technician"} • {activeCount} active jobs
                          </span>
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <span style={{ background: "#2563eb", color: "#fff", borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
                            Selected
                          </span>
                        ) : (
                          <span
                            style={{
                              background: activeCount > 3 ? "#fef3c7" : "#ecfdf5",
                              color: activeCount > 3 ? "#b45309" : "#047857",
                              borderRadius: "999px",
                              padding: "2px 8px",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            {activeCount > 3 ? "Busy" : "Available"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="rp-modal-footer">
              <button type="button" className="rp-btn-secondary" onClick={() => setAssignTechJob(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="rp-btn-primary"
                disabled={Boolean(actionLoading)}
                onClick={() => handleAssignTechnician(assignTechJob, selectedTechForAssign)}
              >
                <Check size={15} />
                {actionLoading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT REPAIR JOB MODAL */}
      {Boolean(editingJob) && (
        <div className="rp-modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="rp-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="rp-modal-head">
              <div className="rp-modal-title-row">
                <div className="rp-modal-icon-badge" style={{ background: "#f1f5f9", color: "#0f172a" }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3>Edit Repair Job #{editingJob.id}</h3>
                  <p>{editFormData.brand} {editFormData.model} • {editFormData.customerName}</p>
                </div>
              </div>
              <button type="button" className="rp-modal-close-btn" onClick={() => setEditingJob(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditJob}>
              <div className="rp-modal-body">
                {actionError && (
                  <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "12px", marginBottom: "14px" }}>
                    {actionError}
                  </div>
                )}

                {/* Section 1: Customer & Address */}
                <div className="rp-form-section">
                  <span className="rp-form-section-title">Customer & Delivery Details</span>
                  <div className="rp-form-grid-2">
                    <div className="rp-field-group">
                      <label>Customer Name</label>
                      <input
                        type="text"
                        className="rp-form-input"
                        value={editFormData.customerName}
                        onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="rp-field-group">
                      <label>Customer Mobile Number</label>
                      <input
                        type="tel"
                        className="rp-form-input"
                        value={editFormData.customerPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="rp-form-grid-2">
                    <div className="rp-field-group">
                      <label>Delivery / Home Address</label>
                      <input
                        type="text"
                        className="rp-form-input"
                        value={editFormData.deliveryAddress}
                        onChange={(e) => setEditFormData({ ...editFormData, deliveryAddress: e.target.value })}
                        placeholder="Street, Mohalla, Area"
                      />
                    </div>
                    <div className="rp-field-group">
                      <label>Landmark</label>
                      <input
                        type="text"
                        className="rp-form-input"
                        value={editFormData.landmark}
                        onChange={(e) => setEditFormData({ ...editFormData, landmark: e.target.value })}
                        placeholder="e.g. Near Ganna Daftar"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Device Specs */}
                <div className="rp-form-section">
                  <span className="rp-form-section-title">Device & Issue Details</span>
                  <div className="rp-form-grid-2">
                    <div className="rp-field-group">
                      <label>Device Brand</label>
                      <input
                        type="text"
                        className="rp-form-input"
                        value={editFormData.brand}
                        onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                        placeholder="e.g. Vivo, Samsung, Apple"
                      />
                    </div>
                    <div className="rp-field-group">
                      <label>Device Model</label>
                      <input
                        type="text"
                        className="rp-form-input"
                        value={editFormData.model}
                        onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                        placeholder="e.g. Z1x, Note 10"
                      />
                    </div>
                  </div>

                  <div className="rp-form-grid-2">
                    <div className="rp-field-group">
                      <label>IMEI / Serial (Optional)</label>
                      <input
                        type="text"
                        className="rp-form-input"
                        value={editFormData.imei}
                        onChange={(e) => setEditFormData({ ...editFormData, imei: e.target.value })}
                        placeholder="15-digit IMEI"
                      />
                    </div>
                    <div className="rp-field-group">
                      <label>Screen PIN / Passcode (Optional)</label>
                      <input
                        type="text"
                        className="rp-form-input"
                        value={editFormData.passcode}
                        onChange={(e) => setEditFormData({ ...editFormData, passcode: e.target.value })}
                        placeholder="Device Lock PIN / Pattern"
                      />
                    </div>
                  </div>

                  <div className="rp-field-group">
                    <label>Reported Problem / Issue</label>
                    <input
                      type="text"
                      className="rp-form-input"
                      value={editFormData.issue}
                      onChange={(e) => setEditFormData({ ...editFormData, issue: e.target.value })}
                      placeholder="e.g. Speaker Problem, Charging Issue"
                      required
                    />
                  </div>

                  <div className="rp-field-group">
                    <label>Diagnosis / Internal Notes</label>
                    <textarea
                      className="rp-form-textarea"
                      rows={2}
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Technical observations, physical marks, or checklist notes"
                    />
                  </div>
                </div>

                {/* Section 3: Cost, Stage & Assignment */}
                <div className="rp-form-section">
                  <span className="rp-form-section-title">Pricing, Stage & Assignment</span>
                  <div className="rp-form-grid-2">
                    <div className="rp-field-group">
                      <label>Total Estimated Cost (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="rp-form-input"
                        value={editFormData.estimatedCost}
                        onChange={(e) => setEditFormData({ ...editFormData, estimatedCost: e.target.value })}
                      />
                    </div>
                    <div className="rp-field-group">
                      <label>Advance Received (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="rp-form-input"
                        value={editFormData.receivedAmount}
                        onChange={(e) => setEditFormData({ ...editFormData, receivedAmount: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Calculated Balance Preview */}
                  <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Calculated Pending Balance:</span>
                    <strong style={{ fontSize: "14px", color: (Number(editFormData.estimatedCost) - Number(editFormData.receivedAmount)) > 0 ? "#e11d48" : "#16a34a" }}>
                      ₹{Math.max(0, Number(editFormData.estimatedCost || 0) - Number(editFormData.receivedAmount || 0))}
                    </strong>
                  </div>

                  <div className="rp-form-grid-2">
                    <div className="rp-field-group">
                      <label>Assigned Technician</label>
                      <select
                        className="rp-form-select"
                        value={editFormData.technicianId}
                        onChange={(e) => setEditFormData({ ...editFormData, technicianId: e.target.value })}
                      >
                        <option value="">Unassigned (Reception Queue)</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {getTechName(t)} {t.phone ? `(${t.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rp-field-group">
                      <label>Repair Stage</label>
                      <select
                        className="rp-form-select"
                        value={editFormData.repairStage}
                        onChange={(e) => setEditFormData({ ...editFormData, repairStage: e.target.value })}
                      >
                        <option value="Device Received">Device Received</option>
                        <option value="Diagnosis">Diagnosis</option>
                        <option value="Waiting Customer Approval">Waiting Customer Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Repair In Progress">Repair In Progress</option>
                        <option value="Waiting Part">Waiting Part</option>
                        <option value="Testing">Testing</option>
                        <option value="Ready">Ready for Handover / Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "4px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={editFormData.isUrgent}
                        onChange={(e) => setEditFormData({ ...editFormData, isUrgent: e.target.checked })}
                      />
                      <span style={{ color: editFormData.isUrgent ? "#e11d48" : "#334155" }}>
                        Mark as URGENT Job (High Priority)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="rp-modal-footer">
                <button type="button" className="rp-btn-secondary" onClick={() => setEditingJob(null)}>
                  Cancel
                </button>
                <button type="submit" className="rp-btn-primary" disabled={Boolean(actionLoading)}>
                  <Save size={15} />
                  {actionLoading ? "Saving..." : "Save Job Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER TRACKING SHARE MODAL */}
      {Boolean(shareTrackingJob) && (() => {
        const phone = getPhone(shareTrackingJob).replace(/\D/g, "");
        const cleanPhone = phone.startsWith("91") && phone.length === 12 ? phone : phone.length === 10 ? `91${phone}` : phone;
        const customer = getCustomerName(shareTrackingJob);
        const device = getDevice(shareTrackingJob);
        const trackingUrl = `${window.location.origin}/track?jobId=${encodeURIComponent(shareTrackingJob.id)}&phone=${encodeURIComponent(cleanPhone.slice(-10))}`;
        const waMessage = `नमस्ते ${customer} जी!\n\nAnsar Telecom में आपके फोन ${device} (Job ID: ${shareTrackingJob.id}) का लाइव रिपेयर व डिलीवरी स्टेटस आप इस लिंक पर लाइव ट्रैक कर सकते हैं:\n${trackingUrl}\n\nधन्यवाद! Ansar Telecom, Basti`;
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

        return (
          <div className="rp-modal-overlay" onClick={() => setShareTrackingJob(null)}>
            <div className="rp-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
              <div className="rp-modal-head">
                <div className="rp-modal-title-row">
                  <div className="rp-modal-icon-badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h3>Customer Live Tracking</h3>
                    <p>Job #{shareTrackingJob.id} • {customer}</p>
                  </div>
                </div>
                <button type="button" className="rp-modal-close-btn" onClick={() => setShareTrackingJob(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="rp-modal-body">
                <div style={{ padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Device:</span>
                    <strong style={{ fontSize: "12px", color: "#0f172a" }}>{device}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Customer Phone:</span>
                    <strong style={{ fontSize: "12px", color: "#0f172a" }}>{getPhone(shareTrackingJob)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Current Status:</span>
                    <strong style={{ fontSize: "12px", color: "#16a34a" }}>{getRepairStage(shareTrackingJob)}</strong>
                  </div>
                  {shareTrackingJob.deliveryRiderName && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Assigned Rider:</span>
                      <strong style={{ fontSize: "12px", color: "#0f172a" }}>{shareTrackingJob.deliveryRiderName}</strong>
                    </div>
                  )}
                </div>

                <div className="rp-field-group">
                  <label>Customer Tracking Web Link</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      readOnly
                      className="rp-form-input"
                      value={trackingUrl}
                      style={{ background: "#f1f5f9", fontSize: "11px", color: "#475569" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyTrackingLink(trackingUrl)}
                      className="rp-btn-secondary"
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "8px 12px" }}
                      title="Copy link to clipboard"
                    >
                      {copiedLinkToast ? <Check size={14} style={{ color: "#16a34a" }} /> : <Copy size={14} />}
                      {copiedLinkToast ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* WhatsApp One-Click Share Button */}
                <div style={{ marginTop: "14px" }}>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#25D366",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "14px",
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)",
                    }}
                  >
                    <MessageCircle size={18} />
                    Send Live Tracking on WhatsApp
                  </a>
                </div>

                {/* Direct Customer Preview */}
                <div style={{ marginTop: "10px" }}>
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      color: "#334155",
                      fontWeight: 700,
                      fontSize: "12px",
                      textDecoration: "none",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <ExternalLink size={14} />
                    Preview Customer Tracking Page
                  </a>
                </div>
              </div>

              <div className="rp-modal-footer">
                <button type="button" className="rp-btn-secondary" onClick={() => setShareTrackingJob(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <ThermalReceiptModal
        isOpen={Boolean(receiptJob)}
        onClose={() => setReceiptJob(null)}
        job={receiptJob}
      />
    </main>
  );
};

export default ReceptionPanel;