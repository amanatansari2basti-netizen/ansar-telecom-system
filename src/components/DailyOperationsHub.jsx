import React, { useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Wrench,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  User,
  Phone,
  IndianRupee,
  Search,
  Filter,
  ArrowRight,
  Printer,
  Download,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Check,
  UserCheck,
  Layers,
  Activity,
  History,
} from "lucide-react";

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
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTimestampDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    return value.toDate();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLocalDateKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatIndianDate = (dateKey) => {
  if (!dateKey) return "";
  const parts = dateKey.split("-");
  if (parts.length !== 3) return dateKey;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeFromTimestamp = (value) => {
  const d = getTimestampDate(value);
  if (!d) return "--:--";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getCustomer = (job) =>
  job?.customer || job?.customerName || "Unknown Customer";

const getPhone = (job) =>
  job?.phone || job?.customerPhone || job?.mobile || "--";

const getDevice = (job) =>
  job?.device ||
  `${job?.brand || ""} ${job?.model || ""}`.trim() ||
  "Device";

const getIssue = (job) =>
  job?.issue ||
  job?.reportedProblem ||
  job?.problem ||
  "Issue not specified";

const getTechnician = (job) =>
  job?.technician ||
  job?.technicianName ||
  job?.assignedTo ||
  job?.assignedTechnician ||
  "Unassigned";

const getAmount = (job) =>
  toNumber(
    job?.estimate?.totalAmount ??
      job?.totalAmount ??
      job?.amount ??
      job?.estimatedCharge
  );

const getReceivedAmount = (job) => {
  const explicit = job?.receivedAmount ?? job?.paidAmount;
  if (explicit !== undefined && explicit !== null) {
    return toNumber(explicit);
  }
  return toNumber(job?.advance ?? job?.advanceReceived);
};

const getRepairStage = (job) => {
  if (job?.repairStage) return job.repairStage;
  switch (job?.status) {
    case "Pending":
      return REPAIR_STAGES.RECEIVED;
    case "In Progress":
      return REPAIR_STAGES.REPAIR;
    case "Ready":
      return REPAIR_STAGES.READY;
    case "Completed":
      return REPAIR_STAGES.DELIVERED;
    case "Returned":
      return REPAIR_STAGES.RETURNED;
    default:
      return job?.status || REPAIR_STAGES.RECEIVED;
  }
};

const DailyOperationsHub = ({
  jobs = [],
  technicians = [],
  staffMembers = [],
  onOpenJob,
  formatCurrency = (val) => `₹${toNumber(val).toLocaleString("en-IN")}`,
}) => {
  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [dateFilterPreset, setDateFilterPreset] = useState("today"); // 'today', 'yesterday', 'custom', 'all'
  const [selectedTechFilter, setSelectedTechFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Preset Handlers
  const handlePresetChange = (preset) => {
    setDateFilterPreset(preset);
    if (preset === "today") {
      setSelectedDate(todayKey);
    } else if (preset === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setSelectedDate(getLocalDateKey(yesterday));
    }
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    if (Number.isNaN(current.getTime())) return;
    current.setDate(current.getDate() - 1);
    setSelectedDate(getLocalDateKey(current));
    setDateFilterPreset("custom");
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    if (Number.isNaN(current.getTime())) return;
    current.setDate(current.getDate() + 1);
    setSelectedDate(getLocalDateKey(current));
    setDateFilterPreset("custom");
  };

  // Helper to check if a timestamp matches the selected date
  const isMatchingSelectedDate = (val) => {
    if (dateFilterPreset === "all") return true;
    const d = getTimestampDate(val);
    if (!d) return false;
    return getLocalDateKey(d) === selectedDate;
  };

  // Calculate Daily Metrics based on selectedDate
  const dailyMetrics = useMemo(() => {
    // 1. Sets Arrived / Created on selectedDate
    const arrivedJobs = jobs.filter((job) =>
      isMatchingSelectedDate(job.createdAt || job.receivedAt)
    );

    // 2. Jobs currently Pending (or created on date and pending)
    const pendingJobs =
      dateFilterPreset === "all"
        ? jobs.filter((j) => j.status === "Pending")
        : arrivedJobs.filter((j) => j.status === "Pending");

    // 3. Jobs In Progress
    const inProgressJobs =
      dateFilterPreset === "all"
        ? jobs.filter((j) => j.status === "In Progress" || j.status === "Paused")
        : jobs.filter((j) => {
            const isCreated = isMatchingSelectedDate(j.createdAt);
            const isInProg = j.status === "In Progress" || j.status === "Paused";
            return isInProg && (isCreated || isMatchingSelectedDate(j.updatedAt));
          });

    // 4. Jobs Ready for Delivery on that date
    const readyJobs = jobs.filter((j) => {
      const isReadyStage =
        j.status === "Ready" || getRepairStage(j) === REPAIR_STAGES.READY;
      if (dateFilterPreset === "all") return isReadyStage;
      return (
        isReadyStage &&
        (isMatchingSelectedDate(j.readyAt) ||
          isMatchingSelectedDate(j.updatedAt) ||
          isMatchingSelectedDate(j.createdAt))
      );
    });

    // 5. Jobs Delivered / Completed on that date
    const deliveredJobs = jobs.filter((j) => {
      const isDelivered =
        j.status === "Completed" ||
        getRepairStage(j) === REPAIR_STAGES.DELIVERED;
      if (dateFilterPreset === "all") return isDelivered;
      return (
        isDelivered &&
        (isMatchingSelectedDate(j.deliveredAt) ||
          isMatchingSelectedDate(j.completedAt) ||
          isMatchingSelectedDate(j.updatedAt))
      );
    });

    // 6. Revenue / Advance collected on that date
    const revenueOnDate = arrivedJobs.reduce(
      (sum, j) => sum + getReceivedAmount(j),
      0
    );

    return {
      arrivedCount: arrivedJobs.length,
      pendingCount: pendingJobs.length,
      inProgressCount: inProgressJobs.length,
      readyCount: readyJobs.length,
      deliveredCount: deliveredJobs.length,
      revenueOnDate,
    };
  }, [jobs, selectedDate, dateFilterPreset]);

  // Technician-wise Productivity & Pending Queue Breakdown
  const technicianDailyStats = useMemo(() => {
    return technicians.map((tech) => {
      const techId = String(tech.id || tech.uid || "");
      const techNameNorm = normalizeText(
        tech.name || tech.fullName || tech.technicianName || ""
      );

      // Jobs assigned to this technician
      const techJobs = jobs.filter((job) => {
        const ids = [
          job.technicianId,
          job.technicianUid,
          job.assignedTechnicianId,
          job.assignedToId,
        ]
          .filter(Boolean)
          .map(String);

        if (ids.length > 0) {
          return ids.includes(techId);
        }
        return normalizeText(getTechnician(job)) === techNameNorm;
      });

      // Pending workload
      const pendingCount = techJobs.filter(
        (j) => j.status === "Pending"
      ).length;

      // In Progress workload
      const inProgressCount = techJobs.filter(
        (j) => j.status === "In Progress" || j.status === "Paused"
      ).length;

      // Repaired / Completed on selected date
      const doneOnDateCount = techJobs.filter((j) => {
        const isFinished =
          j.status === "Ready" ||
          j.status === "Completed" ||
          getRepairStage(j) === REPAIR_STAGES.READY ||
          getRepairStage(j) === REPAIR_STAGES.DELIVERED;

        if (!isFinished) return false;
        if (dateFilterPreset === "all") return true;

        return (
          isMatchingSelectedDate(j.completedAt) ||
          isMatchingSelectedDate(j.readyAt) ||
          isMatchingSelectedDate(j.deliveredAt) ||
          isMatchingSelectedDate(j.updatedAt)
        );
      }).length;

      // Lifetime total completed
      const lifetimeDoneCount = techJobs.filter(
        (j) =>
          j.status === "Ready" ||
          j.status === "Completed" ||
          getRepairStage(j) === REPAIR_STAGES.READY ||
          getRepairStage(j) === REPAIR_STAGES.DELIVERED
      ).length;

      return {
        id: techId,
        name: tech.name || tech.fullName || "Technician",
        specialization: tech.specialization || "Hardware & Software",
        phone: tech.phone || "",
        status: tech.staffStatus || tech.status || "Active",
        pendingCount,
        inProgressCount,
        doneOnDateCount,
        lifetimeDoneCount,
        totalActiveQueue: pendingCount + inProgressCount,
      };
    });
  }, [technicians, jobs, selectedDate, dateFilterPreset]);

  // Itemized List of Jobs for the selected date
  const filteredDailyJobs = useMemo(() => {
    let result = jobs;

    // Filter by Date
    if (dateFilterPreset !== "all") {
      result = result.filter((job) => {
        const matchesCreated = isMatchingSelectedDate(job.createdAt || job.receivedAt);
        const matchesCompleted = isMatchingSelectedDate(job.completedAt || job.readyAt);
        const matchesDelivered = isMatchingSelectedDate(job.deliveredAt);
        const matchesUpdated = isMatchingSelectedDate(job.updatedAt);
        return matchesCreated || matchesCompleted || matchesDelivered || matchesUpdated;
      });
    }

    // Filter by Technician
    if (selectedTechFilter !== "all") {
      result = result.filter((job) => {
        const ids = [
          job.technicianId,
          job.technicianUid,
          job.assignedTechnicianId,
          job.assignedToId,
        ]
          .filter(Boolean)
          .map(String);

        if (ids.length > 0) {
          return ids.includes(selectedTechFilter);
        }
        return false;
      });
    }

    // Filter by Status
    if (selectedStatusFilter !== "all") {
      if (selectedStatusFilter === "arrived") {
        result = result.filter((j) => isMatchingSelectedDate(j.createdAt));
      } else if (selectedStatusFilter === "pending") {
        result = result.filter((j) => j.status === "Pending");
      } else if (selectedStatusFilter === "in_progress") {
        result = result.filter(
          (j) => j.status === "In Progress" || j.status === "Paused"
        );
      } else if (selectedStatusFilter === "ready") {
        result = result.filter(
          (j) => j.status === "Ready" || getRepairStage(j) === REPAIR_STAGES.READY
        );
      } else if (selectedStatusFilter === "delivered") {
        result = result.filter(
          (j) =>
            j.status === "Completed" ||
            getRepairStage(j) === REPAIR_STAGES.DELIVERED
        );
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      result = result.filter((job) => {
        return (
          normalizeText(job.id).includes(q) ||
          normalizeText(getCustomer(job)).includes(q) ||
          normalizeText(getPhone(job)).includes(q) ||
          normalizeText(getDevice(job)).includes(q) ||
          normalizeText(getIssue(job)).includes(q) ||
          normalizeText(getTechnician(job)).includes(q)
        );
      });
    }

    return result;
  }, [
    jobs,
    selectedDate,
    dateFilterPreset,
    selectedTechFilter,
    selectedStatusFilter,
    searchQuery,
  ]);

  // Handle Print / Export
  const handlePrintDailyReport = () => {
    window.print();
  };

  const isTodaySelected = selectedDate === todayKey && dateFilterPreset === "today";

  return (
    <section
      className="dashboard-card admin-panel-card"
      style={{
        margin: "0 0 24px 0",
        border: "1px solid #dbeafe",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        boxShadow: "0 10px 30px rgba(37, 99, 235, 0.04)",
      }}
    >
      {/* =========================================================
          SECTION HEADER WITH CALENDAR & PRESETS
      ========================================================= */}
      <div
        className="card-header admin-card-header"
        style={{
          borderBottom: "1px solid #edf2f7",
          paddingBottom: "18px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              className="admin-section-label"
              style={{ color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "6px" }}
            >
              DAILY WORKSHOP INTELLIGENCE
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 700,
                color: isTodaySelected ? "#16a34a" : "#4b5563",
                background: isTodaySelected ? "#dcfce7" : "#f1f5f9",
                padding: "3px 9px",
                borderRadius: "999px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: isTodaySelected ? "#16a34a" : "#64748b",
                }}
              />
              {isTodaySelected ? "Live Today" : formatIndianDate(selectedDate)}
            </span>
          </div>

          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Daily Work Tracker & Permanent History
          </h3>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
            Select any calendar date to inspect received sets, technician productivity, and completions.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Preset Buttons */}
          <div
            style={{
              display: "inline-flex",
              background: "#f1f5f9",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={() => handlePresetChange("today")}
              style={{
                padding: "6px 12px",
                borderRadius: "7px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: dateFilterPreset === "today" ? "#ffffff" : "transparent",
                color: dateFilterPreset === "today" ? "#2563eb" : "#64748b",
                boxShadow: dateFilterPreset === "today" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange("yesterday")}
              style={{
                padding: "6px 12px",
                borderRadius: "7px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: dateFilterPreset === "yesterday" ? "#ffffff" : "transparent",
                color: dateFilterPreset === "yesterday" ? "#2563eb" : "#64748b",
                boxShadow: dateFilterPreset === "yesterday" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setDateFilterPreset("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "7px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                background: dateFilterPreset === "all" ? "#ffffff" : "transparent",
                color: dateFilterPreset === "all" ? "#2563eb" : "#64748b",
                boxShadow: dateFilterPreset === "all" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
              }}
            >
              All-Time Vault
            </button>
          </div>

          {/* Interactive Calendar Date Picker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "2px 6px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <button
              type="button"
              onClick={handlePrevDay}
              title="Previous Day"
              style={{
                border: "none",
                background: "transparent",
                color: "#475569",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 4px" }}>
              <Calendar size={15} style={{ color: "#2563eb" }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setDateFilterPreset("custom");
                  }
                }}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              title="Next Day"
              style={{
                border: "none",
                background: "transparent",
                color: "#475569",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintDailyReport}
            className="text-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              fontWeight: 700,
              color: "#334155",
            }}
          >
            <Printer size={15} />
            Print Report
          </button>
        </div>
      </div>

      {/* =========================================================
          6 REAL-TIME DAILY KPI METRICS FOR SELECTED DATE
      ========================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
          padding: "18px 20px 0",
        }}
      >
        {/* Metric 1: Total Sets Received on Date */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              Total Intake
            </span>
            <Smartphone size={18} style={{ color: "#2563eb" }} />
          </div>
          <strong style={{ fontSize: "24px", fontWeight: 800, color: "#1e3a8a" }}>
            {dailyMetrics.arrivedCount}
          </strong>
          <span style={{ fontSize: "11px", color: "#3b82f6" }}>
            Sets Arrived {dateFilterPreset === "all" ? "All Time" : `on ${formatIndianDate(selectedDate)}`}
          </span>
        </div>

        {/* Metric 2: Pending in Queue */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
              Pending Queue
            </span>
            <Clock3 size={18} style={{ color: "#d97706" }} />
          </div>
          <strong style={{ fontSize: "24px", fontWeight: 800, color: "#78350f" }}>
            {dailyMetrics.pendingCount}
          </strong>
          <span style={{ fontSize: "11px", color: "#b45309" }}>
            Awaiting Diagnosis / Queue
          </span>
        </div>

        {/* Metric 3: In Progress / Active Repair */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#c2410c", textTransform: "uppercase" }}>
              In Progress
            </span>
            <Wrench size={18} style={{ color: "#ea580c" }} />
          </div>
          <strong style={{ fontSize: "24px", fontWeight: 800, color: "#7c2d12" }}>
            {dailyMetrics.inProgressCount}
          </strong>
          <span style={{ fontSize: "11px", color: "#c2410c" }}>
            On Technician Workbench
          </span>
        </div>

        {/* Metric 4: Ready for Delivery */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>
              Ready for Delivery
            </span>
            <PackageCheck size={18} style={{ color: "#16a34a" }} />
          </div>
          <strong style={{ fontSize: "24px", fontWeight: 800, color: "#14532d" }}>
            {dailyMetrics.readyCount}
          </strong>
          <span style={{ fontSize: "11px", color: "#16a34a" }}>
            Repaired & Tested (Taiyaar Set)
          </span>
        </div>

        {/* Metric 5: Delivered to Customer */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#faf5ff",
            border: "1px solid #e9d5ff",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#7e22ce", textTransform: "uppercase" }}>
              Delivered
            </span>
            <CheckCircle2 size={18} style={{ color: "#9333ea" }} />
          </div>
          <strong style={{ fontSize: "24px", fontWeight: 800, color: "#581c87" }}>
            {dailyMetrics.deliveredCount}
          </strong>
          <span style={{ fontSize: "11px", color: "#7e22ce" }}>
            Handed over to Customer
          </span>
        </div>

        {/* Metric 6: Daily Collection / Revenue */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
              Day Collection
            </span>
            <IndianRupee size={18} style={{ color: "#0f172a" }} />
          </div>
          <strong style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
            {formatCurrency(dailyMetrics.revenueOnDate)}
          </strong>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Advances & Payments Received
          </span>
        </div>
      </div>

      {/* =========================================================
          TECHNICIAN DAILY PRODUCTIVITY & PENDING QUEUE BREAKDOWN
      ========================================================= */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>
                👨‍🔧 Technician Daily Productivity & Pending Queue
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Live breakdown of who has how much pending work and how many jobs were completed on{" "}
                <strong>{formatIndianDate(selectedDate)}</strong>.
              </p>
            </div>

            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
              Total Active Technicians: <strong>{technicians.length}</strong>
            </div>
          </div>

          {technicianDailyStats.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              No technicians registered yet. Add technicians in Settings to track individual workloads.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "12px",
              }}
            >
              {technicianDailyStats.map((tech) => {
                const isSelected = selectedTechFilter === tech.id;
                return (
                  <div
                    key={tech.id}
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: isSelected ? "#eff6ff" : "#f8fafc",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "#2563eb",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}
                        >
                          {tech.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>
                            {tech.name}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {tech.specialization}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTechFilter((prev) => (prev === tech.id ? "all" : tech.id))
                        }
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: isSelected ? "#2563eb" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#334155",
                          cursor: "pointer",
                        }}
                      >
                        {isSelected ? "Filtering" : "Filter Sets"}
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "6px",
                        textAlign: "center",
                        background: "#ffffff",
                        padding: "10px 8px",
                        borderRadius: "10px",
                        border: "1px solid #edf2f7",
                      }}
                    >
                      <div>
                        <strong style={{ display: "block", fontSize: "16px", color: "#d97706", fontWeight: 800 }}>
                          {tech.pendingCount}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
                          Pending
                        </span>
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "16px", color: "#ea580c", fontWeight: 800 }}>
                          {tech.inProgressCount}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
                          In Prog
                        </span>
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "16px", color: "#16a34a", fontWeight: 800 }}>
                          {tech.doneOnDateCount}
                        </strong>
                        <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 700 }}>
                          Done Date
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "#64748b",
                      }}
                    >
                      <span>
                        Total Queue: <strong>{tech.totalActiveQueue} sets</strong>
                      </span>
                      <span>
                        Lifetime Fixed: <strong>{tech.lifetimeDoneCount}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          ITEMIZED DAILY REPAIR SETS INSPECTOR TABLE
      ========================================================= */}
      <div style={{ padding: "20px" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {/* Table Controls Header */}
          <div
            style={{
              padding: "16px 18px",
              borderBottom: "1px solid #edf2f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              background: "#fafcff",
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>
                📋 Detailed Device Log for {formatIndianDate(selectedDate)}
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Showing <strong>{filteredDailyJobs.length}</strong> repair sets matched with chosen criteria.
              </p>
            </div>

            {/* Filter Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {/* Search Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "5px 10px",
                }}
              >
                <Search size={15} style={{ color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Search Job ID, Customer, Model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "12px",
                    color: "#0f172a",
                    width: "180px",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="all">All Stages</option>
                <option value="arrived">Arrived on Date</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="ready">Ready for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>

              {/* Reset Filters */}
              {(selectedTechFilter !== "all" || selectedStatusFilter !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechFilter("all");
                    setSelectedStatusFilter("all");
                    setSearchQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "none",
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table Data */}
          {filteredDailyJobs.length === 0 ? (
            <div
              style={{
                padding: "36px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <Smartphone size={32} style={{ color: "#cbd5e1", marginBottom: "8px" }} />
              <strong style={{ display: "block", fontSize: "14px", color: "#334155" }}>
                No repair records found for this date & filter selection
              </strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                Try switching the date or clearing active search filters.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="jobs-table admin-jobs-table" style={{ width: "100%", margin: 0 }}>
                <thead>
                  <tr>
                    <th>Job ID / Time</th>
                    <th>Customer Details</th>
                    <th>Device & Reported Issue</th>
                    <th>Technician Assigned (Kisne Banaya)</th>
                    <th>Current Status</th>
                    <th>Billing</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyJobs.map((job) => {
                    const stage = getRepairStage(job);
                    const statusClass = normalizeText(job.status).replace(/\s+/g, "-");
                    const totalAmt = getAmount(job);
                    const receivedAmt = getReceivedAmount(job);
                    const pendingAmt = Math.max(0, totalAmt - receivedAmt);

                    return (
                      <tr
                        key={job.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => onOpenJob && onOpenJob(job.id)}
                      >
                        {/* 1. Job ID & Time */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong className="job-id" style={{ fontSize: "13px" }}>
                              {job.id}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              🕒 {formatTimeFromTimestamp(job.createdAt)}
                            </span>
                          </div>
                        </td>

                        {/* 2. Customer & Mobile */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                              {getCustomer(job)}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              📞 {getPhone(job)}
                            </span>
                          </div>
                        </td>

                        {/* 3. Device & Problem */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#1e293b", fontSize: "13px" }}>
                              {getDevice(job)}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#475569" }}>
                              🛠️ {getIssue(job)}
                            </span>
                          </div>
                        </td>

                        {/* 4. Assigned Technician */}
                        <td>
                          <span
                            className={
                              getTechnician(job) === "Unassigned"
                                ? "admin-unassigned"
                                : "admin-technician-name"
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <User size={13} />
                            {getTechnician(job)}
                          </span>
                        </td>

                        {/* 5. Live Stage & Status */}
                        <td>
                          <span className={`admin-job-status admin-job-${statusClass}`}>
                            <i />
                            {stage}
                          </span>
                        </td>

                        {/* 6. Amount */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                              {formatCurrency(totalAmt)}
                            </strong>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: pendingAmt === 0 ? "#16a34a" : "#d97706",
                              }}
                            >
                              {pendingAmt === 0 ? "Fully Paid" : `Pending ₹${pendingAmt}`}
                            </span>
                          </div>
                        </td>

                        {/* 7. Action */}
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenJob) onOpenJob(job.id);
                            }}
                            style={{
                              border: "none",
                              background: "#eff6ff",
                              color: "#2563eb",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            View
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          PERMANENT HISTORY & AUDIT VAULT GUARANTEE
      ========================================================= */}
      <div
        style={{
          margin: "0 20px 20px",
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <ShieldCheck size={20} style={{ color: "#16a34a", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong style={{ display: "block", fontSize: "13px", color: "#14532d" }}>
            Permanent Cloud History & Audit Lock Active
          </strong>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#166534", lineHeight: "1.5" }}>
            Har repair job aur device entry permanent storage me secure hai. Complete lifecycle history,
            technician handoff records, aur customer timestamps database me permanently preserve rehte hain aur kbhi delete nahi hote.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DailyOperationsHub;
