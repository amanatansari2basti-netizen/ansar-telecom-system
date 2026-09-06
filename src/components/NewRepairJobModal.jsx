import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BatteryCharging,
  CalendarDays,
  IndianRupee,
  Loader2,
  LockKeyhole,
  PackageCheck,
  Smartphone,
  User,
  Wrench,
  X,
} from "lucide-react";

import { serverTimestamp } from "firebase/firestore";

import PatternLock from "./PatternLock";
import ThermalReceiptModal from "./ThermalReceiptModal";

import "../newRepairJobModal.css";

/* =========================================================
   INITIAL FORM DATA
========================================================= */

const initialFormData = {
  customerName: "",
  mobileNumber: "",

  brand: "",
  model: "",
  imei: "",

  lockType: "none",
  devicePassword: "",
  devicePattern: [],

  deviceCondition: "Normal",
  conditionNotes: "",

  reportedProblem: "",

  technician: "",
  technicianId: "",

  estimatedCharge: "",
  advanceReceived: "",

  batteryModel: "",
  batteryStatus: "Required",
  batteryQuantity: "1",
  batteryCostPrice: "",
  batteryCustomerPrice: "",
  batteryPayment: "Pending",

  priority: "Normal",

  internalNotes: "",
};

/* =========================================================
   INITIAL ACCESSORIES
========================================================= */

const initialAccessories = {
  charger: false,
  sim: false,
  memoryCard: false,
  cover: false,
  box: false,
  other: false,
};

/* =========================================================
   HELPERS
========================================================= */

const normalizePhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 10);

const sanitizeNumber = (value) => {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0;
  }

  return parsed;
};

/* =========================================================
   COMPONENT
========================================================= */

const NewRepairJobModal = ({
  isOpen,
  onClose,
  onCreateJob,
  technicians = [],
}) => {
  const [
    batteryUsed,
    setBatteryUsed,
  ] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState(initialFormData);

  const [
    accessories,
    setAccessories,
  ] = useState(initialAccessories);

  const [
    otherAccessory,
    setOtherAccessory,
  ] = useState("");

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    createdJobForReceipt,
    setCreatedJobForReceipt,
  ] = useState(null);

  const [
    isReceiptOpen,
    setIsReceiptOpen,
  ] = useState(false);

  /* =========================================================
     RESET
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      setFormData(
        initialFormData
      );

      setAccessories(
        initialAccessories
      );

      setOtherAccessory("");

      setBatteryUsed(false);

      setError("");

      setIsSaving(false);
    }
  }, [isOpen]);

  /* =========================================================
     SORT TECHNICIANS
  ========================================================= */

  const sortedTechnicians =
    useMemo(() => {
      return [
        ...technicians,
      ].sort(
        (
          first,
          second
        ) => {
          const firstStatus =
            first.liveStatus ||
            "Available";

          const secondStatus =
            second.liveStatus ||
            "Available";

          if (
            firstStatus ===
              "Available" &&
            secondStatus !==
              "Available"
          ) {
            return -1;
          }

          if (
            firstStatus !==
              "Available" &&
            secondStatus ===
              "Available"
          ) {
            return 1;
          }

          return (
            Number(
              first.totalQueue ||
                0
            ) -
            Number(
              second.totalQueue ||
                0
            )
          );
        }
      );
    }, [technicians]);

  /* =========================================================
     SELECTED TECHNICIAN
  ========================================================= */

  const selectedTechnician =
    useMemo(() => {
      return technicians.find(
        (tech) =>
          String(
            tech.uid ||
              tech.id ||
              ""
          ) ===
          String(
            formData.technicianId ||
              ""
          )
      );
    }, [
      technicians,
      formData.technicianId,
    ]);

  const handleReceiptClose = () => {
    setIsReceiptOpen(false);
    setCreatedJobForReceipt(null);
    onClose?.();
  };

  if (!isOpen && !isReceiptOpen) {
    return null;
  }

  if (isReceiptOpen && createdJobForReceipt) {
    return (
      <ThermalReceiptModal
        isOpen={true}
        onClose={handleReceiptClose}
        job={createdJobForReceipt}
        autoPrint={true}
      />
    );
  }

  /* =========================================================
     NORMAL CHANGE
  ========================================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setError("");

    if (
      name === "mobileNumber"
    ) {
      setFormData(
        (previous) => ({
          ...previous,

          mobileNumber:
            normalizePhone(
              value
            ),
        })
      );

      return;
    }

    setFormData(
      (previous) => ({
        ...previous,

        [name]: value,
      })
    );
  };

  /* =========================================================
     ACCESSORY CHANGE
  ========================================================= */

  const handleAccessoryChange =
    (name) => {
      setAccessories(
        (previous) => ({
          ...previous,

          [name]:
            !previous[name],
        })
      );
    };

  /* =========================================================
     TECHNICIAN CHANGE
  ========================================================= */

  const handleTechnicianChange =
    (event) => {
      const selectedId =
        event.target.value;

      const selectedTech =
        technicians.find(
          (tech) =>
            String(
              tech.id ||
                tech.uid
            ) ===
            String(
              selectedId
            )
        );

      setFormData(
        (previous) => ({
          ...previous,

          technicianId:
            selectedTech
              ? selectedTech.uid ||
                selectedTech.id
              : "",

          technician:
            selectedTech
              ? selectedTech.name ||
                selectedTech.fullName ||
                selectedTech.technicianName ||
                ""
              : "",
        })
      );
    };

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose?.();
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      setError("");

      /* ===============================
         BASIC VALIDATION
      =============================== */

      const customerName =
        formData.customerName.trim();

      const phone =
        normalizePhone(
          formData.mobileNumber
        );

      const brand =
        formData.brand.trim();

      const model =
        formData.model.trim();

      const issue =
        formData.reportedProblem.trim();

      if (!customerName) {
        setError(
          "Customer name is required."
        );

        return;
      }

      if (
        phone.length !== 10
      ) {
        setError(
          "Enter a valid 10-digit mobile number."
        );

        return;
      }

      if (!brand) {
        setError(
          "Device brand is required."
        );

        return;
      }

      if (!model) {
        setError(
          "Device model is required."
        );

        return;
      }

      if (!issue) {
        setError(
          "Reported problem is required."
        );

        return;
      }

      /* ===============================
         PAYMENT VALIDATION
      =============================== */

      const estimatedCharge =
        sanitizeNumber(
          formData.estimatedCharge
        );

      const advanceReceived =
        sanitizeNumber(
          formData.advanceReceived
        );

      if (
        estimatedCharge > 0 &&
        advanceReceived >
          estimatedCharge
      ) {
        setError(
          "Advance received cannot be greater than estimated charge."
        );

        return;
      }

      if (
        estimatedCharge === 0 &&
        advanceReceived > 0
      ) {
        setError(
          "Enter an estimated charge before recording advance payment."
        );

        return;
      }

      /* ===============================
         BATTERY VALIDATION
      =============================== */

      const batteryQuantity =
        Math.max(
          Number(
            formData.batteryQuantity
          ) || 1,
          1
        );

      const batteryCostPrice =
        sanitizeNumber(
          formData.batteryCostPrice
        );

      const batteryCustomerPrice =
        sanitizeNumber(
          formData.batteryCustomerPrice
        );

      if (
        batteryUsed &&
        !formData.batteryModel.trim()
      ) {
        setError(
          "Battery model is required when Battery Involved is enabled."
        );

        return;
      }

      /* ===============================
         ACCESSORIES
      =============================== */

      const receivedAccessories =
        [];

      if (
        accessories.charger
      ) {
        receivedAccessories.push(
          "Charger"
        );
      }

      if (accessories.sim) {
        receivedAccessories.push(
          "SIM Card"
        );
      }

      if (
        accessories.memoryCard
      ) {
        receivedAccessories.push(
          "Memory Card"
        );
      }

      if (
        accessories.cover
      ) {
        receivedAccessories.push(
          "Cover / Case"
        );
      }

      if (accessories.box) {
        receivedAccessories.push(
          "Device Box"
        );
      }

      if (
        accessories.other &&
        otherAccessory.trim()
      ) {
        receivedAccessories.push(
          otherAccessory.trim()
        );
      }

      /* ===============================
         PAYMENT STATUS
      =============================== */

      const paymentStatus =
        estimatedCharge > 0 &&
        advanceReceived >=
          estimatedCharge
          ? "Paid"
          : advanceReceived > 0
          ? "Advance Paid"
          : "Pending";

      /* ===============================
         LOCAL DISPLAY DATE
      =============================== */

      const now =
        new Date();

      const receivedDate =
        now.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );

      /* ===============================
         CREATE JOB OBJECT
      =============================== */

      const newJob = {
        /* -----------------------------
           CUSTOMER
        ----------------------------- */

        customer:
          customerName,

        customerName,

        phone,

        mobileNumber:
          phone,

        customerPhone:
          phone,

        /* -----------------------------
           DEVICE
        ----------------------------- */

        brand,

        model,

        device:
          `${brand} ${model}`.trim(),

        deviceModel:
          `${brand} ${model}`.trim(),

        imei:
          formData.imei.trim(),

        condition:
          formData.deviceCondition || "Normal",

        deviceCondition:
          formData.deviceCondition || "Normal",

        conditionNotes:
          formData.conditionNotes.trim() || "",

        lockType: formData.lockType || "none",

        devicePassword:
          formData.lockType === "pin" ? formData.devicePassword.trim() : "",

        devicePattern:
          formData.lockType === "pattern" && Array.isArray(formData.devicePattern)
            ? formData.devicePattern
            : [],

        lockCode:
          formData.lockType === "pattern" && Array.isArray(formData.devicePattern) && formData.devicePattern.length
            ? `Pattern: ${formData.devicePattern.join("-")}`
            : formData.lockType === "pin" && formData.devicePassword?.trim()
            ? `PIN: ${formData.devicePassword.trim()}`
            : "No Lock",

        issue,

        reportedProblem:
          issue,

        /* -----------------------------
           ACCESSORIES
        ----------------------------- */

        accessoriesReceived:
          receivedAccessories,

        accessories: {
          charger:
            accessories.charger,

          sim:
            accessories.sim,

          memoryCard:
            accessories.memoryCard,

          cover:
            accessories.cover,

          box:
            accessories.box,

          other:
            accessories.other
              ? otherAccessory.trim()
              : "",
        },

        /* -----------------------------
           TECHNICIAN
        ----------------------------- */

        technician:
          formData.technician ||
          "",

        technicianName:
          formData.technician ||
          "",

        technicianId:
          formData.technicianId ||
          "",

        technicianUid:
          formData.technicianId ||
          "",

        assignedTechnicianId:
          formData.technicianId ||
          "",

        assignedToId:
          formData.technicianId ||
          "",

        assignedAt:
          formData.technicianId
            ? serverTimestamp()
            : null,

        lastAssignedAt:
          formData.technicianId
            ? serverTimestamp()
            : null,

        assignmentAlertTrigger:
          formData.technicianId
            ? Date.now()
            : null,

        /* =====================================================
           LEGACY INTERNAL STATUS

           DO NOT REMOVE YET.

           Existing Owner / Reception /
           Technician panels depend on it.
        ===================================================== */

        status:
          "Pending",

        /* =====================================================
           V2 REPAIR LIFECYCLE
        ===================================================== */

        repairStage:
          "Device Received",

        customerStatus:
          "Your device has been received at Ansar Telecom.",

        customerStatusCode:
          "DEVICE_RECEIVED",

        /* -----------------------------
           DIAGNOSIS
        ----------------------------- */

        diagnosis: {
          status:
            "Not Started",

          summary: "",

          technicianNotes: "",

          diagnosedBy: "",

          diagnosedByUid: "",

          startedAt: null,

          completedAt: null,
        },

        /* -----------------------------
           ESTIMATE
        ----------------------------- */

        estimate: {
          status:
            estimatedCharge > 0
              ? "Initial Estimate"
              : "Not Prepared",

          partsAmount: 0,

          labourAmount: 0,

          totalAmount:
            estimatedCharge,

          notes: "",

          preparedBy: "",

          preparedByUid: "",

          preparedAt: null,
        },

        /* -----------------------------
           CUSTOMER APPROVAL
        ----------------------------- */

        customerApproval: {
          status:
            "Not Required Yet",

          requestedAt: null,

          respondedAt: null,

          approvedAt: null,

          rejectedAt: null,

          source: "",

          notes: "",
        },

        /* -----------------------------
           PART STATUS
        ----------------------------- */

        partRequirement: {
          status:
            "Not Required",

          partName: "",

          notes: "",

          requestedAt: null,

          receivedAt: null,
        },

        /* -----------------------------
           TESTING
        ----------------------------- */

        testing: {
          status:
            "Not Started",

          notes: "",

          startedAt: null,

          completedAt: null,
        },

        /* -----------------------------
           DELIVERY
        ----------------------------- */

        delivery: {
          status:
            "At Shop",

          method: "",

          readyAt: null,

          deliveredAt: null,

          deliveredBy: "",

          notes: "",
        },

        /* -----------------------------
           CUSTOMER TRACKING
        ----------------------------- */

        customerTrackingEnabled:
          true,

        trackingVisibility: {
          showRepairStage: true,

          showEstimate: true,

          showTechnician:
            false,

          showInternalNotes:
            false,

          showPayment:
            true,
        },

        /* -----------------------------
           STAGE HISTORY
        ----------------------------- */

        stageHistory: [
          {
            stage:
              "Device Received",

            customerStatus:
              "Your device has been received at Ansar Telecom.",

            source:
              "Reception",

            createdAt:
              now.toISOString(),
          },
        ],

        /* -----------------------------
           PRIORITY
        ----------------------------- */

        priority:
          formData.priority,

        /* -----------------------------
           PAYMENT
        ----------------------------- */

        amount:
          estimatedCharge,

        estimatedCharge,

        advance:
          advanceReceived,

        advanceReceived,

        payment:
          paymentStatus,

        paymentStatus,

        /* -----------------------------
           RECEIVED
        ----------------------------- */

        received:
          receivedDate,

        receivedDate,

        /* -----------------------------
           INTERNAL NOTES
        ----------------------------- */

        notes:
          formData.internalNotes.trim(),

        internalNotes:
          formData.internalNotes.trim(),

        /* -----------------------------
           BATTERY
        ----------------------------- */

        batteryUsed,

        battery:
          batteryUsed
            ? {
                model:
                  formData.batteryModel.trim(),

                status:
                  formData.batteryStatus,

                quantity:
                  batteryQuantity,

                costPrice:
                  batteryCostPrice,

                customerPrice:
                  batteryCustomerPrice,

                payment:
                  formData.batteryPayment,
              }
            : null,

        /* -----------------------------
           FUTURE PICK & DROP LINK
        ----------------------------- */

        pickupRequestId: "",

        deliveryRequestId: "",

        serviceMode:
          "Walk In",

        /* -----------------------------
           FUTURE WHATSAPP
        ----------------------------- */

        whatsapp: {
          notificationsEnabled:
            true,

          lastNotificationType:
            "",

          lastNotificationAt:
            null,
        },
      };

      /* ===============================
         SAVE
      =============================== */

      try {
        setIsSaving(true);

        let createdResultId = null;
        if (onCreateJob) {
          createdResultId = await onCreateJob(
            newJob
          );
        }

        // Prepare job object for instant thermal receipt printing
        const resolvedId = (typeof createdResultId === "string" && createdResultId.startsWith("AT-"))
          ? createdResultId
          : `AT-${Date.now().toString().slice(-4)}`;

        const receiptPayload = {
          ...newJob,
          id: resolvedId,
          jobId: resolvedId,
          createdAt: new Date(),
        };

        setFormData(
          initialFormData
        );

        setAccessories(
          initialAccessories
        );

        setOtherAccessory("");

        setBatteryUsed(false);

        // Set thermal receipt modal to display and auto-print
        setCreatedJobForReceipt(receiptPayload);
        setIsReceiptOpen(true);
      } catch (
        submissionError
      ) {
        console.error(
          "Unable to create repair job:",
          submissionError
        );

        setError(
          submissionError?.message ||
            "Unable to create repair job. Please try again."
        );
      } finally {
        setIsSaving(false);
      }
    };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="job-modal-overlay"
      onMouseDown={
        handleClose
      }
    >
      <div
        className="job-modal"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="job-modal-header">

          <div>
            <span className="job-modal-eyebrow">
              New Repair Entry
            </span>

            <h2>
              Create Repair Job
            </h2>

            <p>
              Register customer,
              device and repair
              information.
            </p>
          </div>

          <button
            type="button"
            className="job-modal-close"
            onClick={
              handleClose
            }
            aria-label="Close"
            disabled={
              isSaving
            }
          >
            <X size={20} />
          </button>

        </div>

        <form
          className="job-modal-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* =================================================
              CUSTOMER
          ================================================= */}

          <section className="job-form-section">

            <div className="job-section-heading">

              <div className="job-section-icon blue">
                <User size={18} />
              </div>

              <div>
                <h3>
                  Customer Details
                </h3>

                <p>
                  Customer contact
                  information
                </p>
              </div>

            </div>

            <div className="job-form-grid two">

              <div className="job-field">

                <label>
                  Customer Name *
                </label>

                <input
                  name="customerName"
                  type="text"
                  value={
                    formData.customerName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter customer name"
                  required
                  disabled={
                    isSaving
                  }
                />

              </div>

              <div className="job-field">

                <label>
                  Mobile Number *
                </label>

                <input
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={
                    formData.mobileNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="10-digit mobile number"
                  required
                  disabled={
                    isSaving
                  }
                />

              </div>

            </div>

          </section>

          {/* =================================================
              DEVICE
          ================================================= */}

          <section className="job-form-section">

            <div className="job-section-heading">

              <div className="job-section-icon purple">
                <Smartphone
                  size={18}
                />
              </div>

              <div>
                <h3>
                  Device Details
                </h3>

                <p>
                  Device received
                  for repair
                </p>
              </div>

            </div>

            <div className="job-form-grid two">

              <div className="job-field">

                <label>
                  Brand *
                </label>

                <input
                  name="brand"
                  type="text"
                  value={
                    formData.brand
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Samsung, Apple, Vivo..."
                  required
                  disabled={
                    isSaving
                  }
                />

              </div>

              <div className="job-field">

                <label>
                  Model *
                </label>

                <input
                  name="model"
                  type="text"
                  value={
                    formData.model
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter device model"
                  required
                  disabled={
                    isSaving
                  }
                />

              </div>

              <div className="job-field">

                <label>
                  IMEI / Serial Number
                </label>

                <input
                  name="imei"
                  type="text"
                  value={
                    formData.imei
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                  disabled={
                    isSaving
                  }
                />

              </div>

              {/* DEVICE PASSWORD / SCREEN PATTERN LOCK (स्क्रीन लॉक / पासवर्ड) */}
              <div
                className="job-field full"
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px",
                  marginTop: "6px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <LockKeyhole size={16} style={{ color: "#2563eb" }} />
                      <span>Screen Lock / Password (फोन लॉक / पासवर्ड)</span>
                    </label>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Customer ka pattern ya PIN yahan lagayein taaki technician device check kar sake
                    </span>
                  </div>

                  {/* Segmented Switch */}
                  <div
                    style={{
                      display: "inline-flex",
                      backgroundColor: "#e2e8f0",
                      padding: "3px",
                      borderRadius: "10px",
                      gap: "3px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          lockType: "none",
                        }))
                      }
                      style={{
                        padding: "6px 11px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "7px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor:
                          formData.lockType === "none"
                            ? "#ffffff"
                            : "transparent",
                        color:
                          formData.lockType === "none"
                            ? "#0f172a"
                            : "#64748b",
                        boxShadow:
                          formData.lockType === "none"
                            ? "0 1px 3px rgba(0,0,0,0.1)"
                            : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      No Lock (खुला है)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          lockType: "pin",
                        }))
                      }
                      style={{
                        padding: "6px 11px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "7px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor:
                          formData.lockType === "pin"
                            ? "#ffffff"
                            : "transparent",
                        color:
                          formData.lockType === "pin"
                            ? "#2563eb"
                            : "#64748b",
                        boxShadow:
                          formData.lockType === "pin"
                            ? "0 1px 3px rgba(0,0,0,0.1)"
                            : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      PIN / Password
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          lockType: "pattern",
                        }))
                      }
                      style={{
                        padding: "6px 11px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "7px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor:
                          formData.lockType === "pattern"
                            ? "#ffffff"
                            : "transparent",
                        color:
                          formData.lockType === "pattern"
                            ? "#2563eb"
                            : "#64748b",
                        boxShadow:
                          formData.lockType === "pattern"
                            ? "0 1px 3px rgba(0,0,0,0.1)"
                            : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Pattern Lock (पैटर्न)
                    </button>
                  </div>
                </div>

                {/* Option 1: PIN / Text */}
                {formData.lockType === "pin" && (
                  <div style={{ marginTop: "6px" }}>
                    <input
                      type="text"
                      name="devicePassword"
                      value={formData.devicePassword || ""}
                      onChange={handleChange}
                      placeholder="e.g. 1234, 0000, 2580 ya koi text password"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "15px",
                        fontWeight: 600,
                        borderRadius: "9px",
                        border: "1.5px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                      }}
                      disabled={isSaving}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginTop: "5px",
                        display: "block",
                      }}
                    >
                      Customer ka PIN ya password enter karein - Technician ko seedha show hoga.
                    </span>
                  </div>
                )}

                {/* Option 2: 3x3 Interactive Pattern Lock */}
                {formData.lockType === "pattern" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginTop: "6px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#475569",
                        marginBottom: "10px",
                        textAlign: "center",
                      }}
                    >
                      Customer dwara bataye gaye dots ko touch karein ya ungli ghumakar pattern draw karein:
                    </p>

                    <PatternLock
                      value={formData.devicePattern || []}
                      onChange={(newPattern) => {
                        setFormData((prev) => ({
                          ...prev,
                          devicePattern: newPattern,
                        }));
                      }}
                    />
                  </div>
                )}

                {/* Option 3: No Lock */}
                {formData.lockType === "none" && (
                  <div
                    style={{
                      padding: "9px 12px",
                      backgroundColor: "#f1f5f9",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    ✓ Is device me koi lock nahi hai (Swipe to open).
                  </div>
                )}
              </div>

              <div className="job-field full">

                <label>
                  Reported Problem *
                </label>

                <textarea
                  name="reportedProblem"
                  rows="3"
                  value={
                    formData.reportedProblem
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Describe the customer complaint..."
                  required
                  disabled={
                    isSaving
                  }
                />

              </div>

            </div>

          </section>

          {/* =================================================
              ACCESSORIES RECEIVED
          ================================================= */}

          <section className="job-form-section">

            <div className="job-section-heading">

              <div className="job-section-icon slate">
                <PackageCheck
                  size={18}
                />
              </div>

              <div>
                <h3>
                  Accessories Received
                </h3>

                <p>
                  Record everything
                  received with the
                  device
                </p>
              </div>

            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >

              {[
                [
                  "charger",
                  "Charger",
                ],
                [
                  "sim",
                  "SIM Card",
                ],
                [
                  "memoryCard",
                  "Memory Card",
                ],
                [
                  "cover",
                  "Cover / Case",
                ],
                [
                  "box",
                  "Device Box",
                ],
                [
                  "other",
                  "Other",
                ],
              ].map(
                ([
                  key,
                  label,
                ]) => (
                  <label
                    key={key}
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "7px",
                      padding:
                        "9px 12px",
                      border:
                        "1px solid #e7ecf2",
                      borderRadius:
                        "9px",
                      background:
                        accessories[
                          key
                        ]
                          ? "#f1f5f9"
                          : "#ffffff",
                      cursor:
                        isSaving
                          ? "default"
                          : "pointer",
                      fontSize:
                        "12px",
                      fontWeight:
                        600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        accessories[
                          key
                        ]
                      }
                      onChange={() =>
                        handleAccessoryChange(
                          key
                        )
                      }
                      disabled={
                        isSaving
                      }
                    />

                    {label}
                  </label>
                )
              )}

            </div>

            {accessories.other && (
              <div
                className="job-field"
                style={{
                  marginTop:
                    "12px",
                }}
              >

                <label>
                  Other Accessory
                </label>

                <input
                  type="text"
                  value={
                    otherAccessory
                  }
                  onChange={(
                    event
                  ) =>
                    setOtherAccessory(
                      event.target
                        .value
                    )
                  }
                  placeholder="Describe accessory..."
                  disabled={
                    isSaving
                  }
                />

              </div>
            )}

          </section>

          {/* =================================================
              REPAIR ASSIGNMENT
          ================================================= */}

          <section className="job-form-section">

            <div className="job-section-heading">

              <div className="job-section-icon orange">
                <Wrench size={18} />
              </div>

              <div>
                <h3>
                  Repair Assignment
                </h3>

                <p>
                  Assign technician
                  and record initial
                  estimate
                </p>
              </div>

            </div>

            <div className="job-form-grid three">

              <div className="job-field">

                <label>
                  Technician
                </label>

                <select
                  name="technicianId"
                  value={
                    formData.technicianId
                  }
                  onChange={
                    handleTechnicianChange
                  }
                  disabled={
                    isSaving
                  }
                >

                  <option value="">
                    Select technician
                  </option>

                  {sortedTechnicians.map(
                    (
                      technician
                    ) => {
                      const techId =
                        technician.uid ||
                        technician.id;

                      const techName =
                        technician.name ||
                        technician.fullName ||
                        technician.technicianName ||
                        "Technician";

                      const status =
                        technician.liveStatus ||
                        "Available";

                      const totalQueue =
                        Number(
                          technician.totalQueue ||
                            0
                        );

                      const working =
                        Number(
                          technician.inProgressCount ||
                            0
                        );

                      const waiting =
                        Number(
                          technician.pendingCount ||
                            0
                        );

                      return (
                        <option
                          key={
                            techId
                          }
                          value={
                            techId
                          }
                        >
                          {techName}
                          {" — "}
                          {status}
                          {" · "}
                          {totalQueue}
                          {totalQueue ===
                          1
                            ? " Job"
                            : " Jobs"}
                          {totalQueue >
                          0
                            ? ` · ${working} Working · ${waiting} Waiting`
                            : ""}
                        </option>
                      );
                    }
                  )}

                </select>

                {technicians.length ===
                  0 && (
                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "7px",
                      color:
                        "#98a2b3",
                      fontSize:
                        "11px",
                    }}
                  >
                    No technician is
                    currently available
                    for assignment.
                  </small>
                )}

                {selectedTechnician && (
                  <div
                    style={{
                      marginTop:
                        "9px",
                      padding:
                        "10px 11px",
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap:
                        "6px 12px",
                      background:
                        "#f8fafc",
                      border:
                        "1px solid #e7ecf2",
                      borderRadius:
                        "9px",
                      color:
                        "#667085",
                      fontSize:
                        "11px",
                      fontWeight:
                        600,
                    }}
                  >

                    <span>
                      Status:{" "}

                      <strong>
                        {selectedTechnician.liveStatus ||
                          "Available"}
                      </strong>
                    </span>

                    <span>
                      Working:{" "}

                      <strong>
                        {selectedTechnician.inProgressCount ||
                          0}
                      </strong>
                    </span>

                    <span>
                      Waiting:{" "}

                      <strong>
                        {selectedTechnician.pendingCount ||
                          0}
                      </strong>
                    </span>

                    <span>
                      Queue:{" "}

                      <strong>
                        {selectedTechnician.totalQueue ||
                          0}
                      </strong>
                    </span>

                  </div>
                )}

              </div>

              <div className="job-field">

                <label>
                  Initial Estimate
                </label>

                <div className="job-money-input">

                  <IndianRupee
                    size={15}
                  />

                  <input
                    name="estimatedCharge"
                    type="number"
                    min="0"
                    value={
                      formData.estimatedCharge
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                    disabled={
                      isSaving
                    }
                  />

                </div>

              </div>

              <div className="job-field">

                <label>
                  Advance Received
                </label>

                <div className="job-money-input">

                  <IndianRupee
                    size={15}
                  />

                  <input
                    name="advanceReceived"
                    type="number"
                    min="0"
                    value={
                      formData.advanceReceived
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                    disabled={
                      isSaving
                    }
                  />

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              BATTERY
          ================================================= */}

          <section className="job-form-section battery-job-section">

            <div className="battery-section-top">

              <div className="job-section-heading">

                <div className="job-section-icon green">
                  <BatteryCharging
                    size={18}
                  />
                </div>

                <div>
                  <h3>
                    Battery Tracking
                  </h3>

                  <p>
                    Link battery usage
                    with this repair
                  </p>
                </div>

              </div>

              <label className="battery-toggle">

                <input
                  type="checkbox"
                  checked={
                    batteryUsed
                  }
                  onChange={(
                    event
                  ) =>
                    setBatteryUsed(
                      event.target
                        .checked
                    )
                  }
                  disabled={
                    isSaving
                  }
                />

                <span className="battery-toggle-track">
                  <span />
                </span>

                <strong>
                  Battery Involved
                </strong>

              </label>

            </div>

            {batteryUsed && (
              <div className="battery-job-fields">

                <div className="job-form-grid three">

                  <div className="job-field">

                    <label>
                      Battery Model *
                    </label>

                    <input
                      name="batteryModel"
                      type="text"
                      value={
                        formData.batteryModel
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. BN46"
                      required
                      disabled={
                        isSaving
                      }
                    />

                  </div>

                  <div className="job-field">

                    <label>
                      Battery Status
                    </label>

                    <select
                      name="batteryStatus"
                      value={
                        formData.batteryStatus
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSaving
                      }
                    >
                      <option value="Required">
                        Required
                      </option>

                      <option value="Installed">
                        Installed
                      </option>

                      <option value="Reserved">
                        Reserved
                      </option>

                      <option value="Returned">
                        Returned
                      </option>
                    </select>

                  </div>

                  <div className="job-field">

                    <label>
                      Quantity
                    </label>

                    <input
                      name="batteryQuantity"
                      type="number"
                      min="1"
                      value={
                        formData.batteryQuantity
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSaving
                      }
                    />

                  </div>

                  <div className="job-field">

                    <label>
                      Battery Cost Price
                    </label>

                    <div className="job-money-input">

                      <IndianRupee
                        size={15}
                      />

                      <input
                        name="batteryCostPrice"
                        type="number"
                        min="0"
                        value={
                          formData.batteryCostPrice
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="0"
                        disabled={
                          isSaving
                        }
                      />

                    </div>

                  </div>

                  <div className="job-field">

                    <label>
                      Customer Price *
                    </label>

                    <div className="job-money-input">

                      <IndianRupee
                        size={15}
                      />

                      <input
                        name="batteryCustomerPrice"
                        type="number"
                        min="0"
                        value={
                          formData.batteryCustomerPrice
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="0"
                        required
                        disabled={
                          isSaving
                        }
                      />

                    </div>

                  </div>

                  <div className="job-field">

                    <label>
                      Battery Payment
                    </label>

                    <select
                      name="batteryPayment"
                      value={
                        formData.batteryPayment
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        isSaving
                      }
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Paid">
                        Paid
                      </option>

                      <option value="Included in Repair Bill">
                        Included in Repair Bill
                      </option>
                    </select>

                  </div>

                </div>

                <div className="battery-tracking-note">

                  <BatteryCharging
                    size={17}
                  />

                  <p>
                    Battery will be
                    linked with this
                    Repair Job ID for
                    installation,
                    payment and
                    tracking.
                  </p>

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              JOB INFORMATION
          ================================================= */}

          <section className="job-form-section">

            <div className="job-section-heading">

              <div className="job-section-icon slate">
                <CalendarDays
                  size={18}
                />
              </div>

              <div>
                <h3>
                  Job Information
                </h3>

                <p>
                  Priority and internal
                  repair notes
                </p>
              </div>

            </div>

            <div className="job-form-grid two">

              <div className="job-field">

                <label>
                  Priority
                </label>

                <select
                  name="priority"
                  value={
                    formData.priority
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    isSaving
                  }
                >
                  <option value="Normal">
                    Normal
                  </option>

                  <option value="Urgent">
                    Urgent
                  </option>

                  <option value="High Priority">
                    High Priority
                  </option>
                </select>

              </div>

              <div className="job-field">

                <label>
                  Initial Repair Stage
                </label>

                <select
                  value="Device Received"
                  disabled
                >
                  <option>
                    Device Received
                  </option>
                </select>

                <small
                  style={{
                    display:
                      "block",
                    marginTop:
                      "7px",
                    color:
                      "#98a2b3",
                    fontSize:
                      "11px",
                    lineHeight:
                      1.5,
                  }}
                >
                  Technician will begin
                  diagnosis after
                  starting the job.
                </small>

              </div>

              <div className="job-field full">

                <label>
                  Internal Notes
                </label>

                <textarea
                  name="internalNotes"
                  rows="3"
                  value={
                    formData.internalNotes
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Special instructions or private staff notes..."
                  disabled={
                    isSaving
                  }
                />

              </div>

            </div>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
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
                  "13px",
              }}
            >
              {error}
            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="job-modal-footer">

            <button
              type="button"
              className="job-cancel-button"
              onClick={
                handleClose
              }
              disabled={
                isSaving
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="job-create-button"
              disabled={
                isSaving
              }
            >

              {isSaving ? (
                <>
                  <Loader2
                    size={17}
                    className="spin"
                  />

                  Creating...
                </>
              ) : (
                <>
                  <Wrench
                    size={17}
                  />

                  Create Repair Job
                </>
              )}

            </button>

          </div>

        </form>

      </div>

      {/* =========================================================
          THERMAL RECEIPT PRINTING (80mm / 58mm)
      ========================================================= */}
      {isReceiptOpen && createdJobForReceipt && (
        <ThermalReceiptModal
          isOpen={isReceiptOpen}
          onClose={handleReceiptClose}
          job={createdJobForReceipt}
          autoPrint={true}
        />
      )}
    </div>
  );
};

export default NewRepairJobModal;