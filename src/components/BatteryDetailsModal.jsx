import { useEffect, useState } from "react";

import {
  BatteryCharging,
  IndianRupee,
  Loader2,
  Save,
  Smartphone,
  X,
} from "lucide-react";

import "../batteryDetailsModal.css";

const BatteryDetailsModal = ({
  isOpen,
  onClose,
  record,
  onUpdate,
}) => {
  /* ========================================
     FORM STATE
  ======================================== */

  const [formData, setFormData] = useState({
    model: "",
    status: "Required",
    payment: "Pending",
    costPrice: "",
    customerPrice: "",
    quantity: "1",
  });

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  /* ========================================
     LOAD SELECTED BATTERY
  ======================================== */

  useEffect(() => {
    if (!record || !isOpen) {
      return;
    }

    setFormData({
      model: record.model || "",
      status:
        record.status || "Required",
      payment:
        record.payment || "Pending",
      costPrice:
        record.costPrice ?? "",
      customerPrice:
        record.customerPrice ?? "",
      quantity: String(
        record.quantity || 1
      ),
    });

    setSaveError("");
    setIsSaving(false);
  }, [record, isOpen]);

  /* ========================================
     CLOSED MODAL
  ======================================== */

  if (!isOpen || !record) {
    return null;
  }

  /* ========================================
     CALCULATIONS
  ======================================== */

  const quantity = Math.max(
    Number(formData.quantity) || 1,
    1
  );

  const costPrice = Math.max(
    Number(formData.costPrice) || 0,
    0
  );

  const customerPrice = Math.max(
    Number(formData.customerPrice) || 0,
    0
  );

  const totalCost =
    costPrice * quantity;

  const totalSale =
    customerPrice * quantity;

  const estimatedProfit =
    totalSale - totalCost;

  /* ========================================
     CHANGE
  ======================================== */

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setSaveError("");

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* ========================================
     CLOSE
  ======================================== */

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    setSaveError("");

    onClose?.();
  };

  /* ========================================
     SAVE
  ======================================== */

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setSaveError("");

    const model =
      String(formData.model || "")
        .trim();

    if (!model) {
      setSaveError(
        "Battery model is required."
      );

      return;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      setSaveError(
        "Quantity must be at least 1."
      );

      return;
    }

    if (costPrice < 0) {
      setSaveError(
        "Cost price cannot be negative."
      );

      return;
    }

    if (customerPrice < 0) {
      setSaveError(
        "Customer price cannot be negative."
      );

      return;
    }

    const updatedRecord = {
      ...record,

      /*
       * firestoreId from BatteryTracking.jsx
       * remains preserved here.
       */

      model,

      status:
        formData.status,

      payment:
        formData.payment,

      quantity,

      costPrice,

      customerPrice,

      totalCost,

      totalSale,

      profit:
        estimatedProfit,
    };

    try {
      setIsSaving(true);

      /*
       * BatteryTracking.jsx performs
       * the actual Firestore update.
       */

      await onUpdate?.(
        updatedRecord
      );

      /*
       * Do not call onClose here.
       * Parent closes modal only after
       * successful Firestore update.
       */

    } catch (error) {
      console.error(
        "Unable to save battery changes:",
        error
      );

      setSaveError(
        "Battery changes could not be saved. Please try again."
      );

      setIsSaving(false);
    }
  };

  return (
    <div
      className="battery-details-overlay"
      onMouseDown={handleClose}
    >
      <div
        className="battery-details-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* ========================================
            HEADER
        ======================================== */}

        <div className="battery-details-header">

          <div>
            <span className="battery-details-eyebrow">
              Battery Record
            </span>

            <h2>
              {formData.model ||
                record.model ||
                "Battery"}
            </h2>

            <p>
              Update battery status,
              payment and pricing.
            </p>
          </div>

          <button
            type="button"
            className="battery-details-close"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close battery details"
          >
            <X size={20} />
          </button>

        </div>

        {/* ========================================
            CONTENT
        ======================================== */}

        <div className="battery-details-content">

          {/* ========================================
              LINKED REPAIR JOB
          ======================================== */}

          <section className="battery-details-section">

            <div className="battery-details-section-title">

              <BatteryCharging size={18} />

              <div>
                <h3>
                  Linked Repair Job
                </h3>

                <p>
                  Battery assignment information
                </p>
              </div>

            </div>

            <div className="battery-details-info-grid">

              <div>
                <span>
                  Job ID
                </span>

                <strong>
                  {record.jobId || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Battery Model
                </span>

                <strong>
                  {formData.model || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Customer
                </span>

                <strong>
                  {record.customer || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Device
                </span>

                <strong>
                  {record.device || "—"}
                </strong>
              </div>

            </div>

          </section>

          {/* ========================================
              TRACKING
          ======================================== */}

          <section className="battery-details-section">

            <div className="battery-details-section-title">

              <Smartphone size={18} />

              <div>
                <h3>
                  Tracking Status
                </h3>

                <p>
                  Current battery movement
                  and payment
                </p>
              </div>

            </div>

            <div className="battery-details-form-grid">

              {/* BATTERY STATUS */}

              <div className="battery-details-field">

                <label htmlFor="battery-status">
                  Battery Status
                </label>

                <select
                  id="battery-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isSaving}
                >
                  <option value="Required">
                    Required
                  </option>

                  <option value="Reserved">
                    Reserved
                  </option>

                  <option value="Installed">
                    Installed
                  </option>

                  <option value="Returned">
                    Returned
                  </option>
                </select>

              </div>

              {/* PAYMENT STATUS */}

              <div className="battery-details-field">

                <label htmlFor="battery-payment">
                  Payment Status
                </label>

                <select
                  id="battery-payment"
                  name="payment"
                  value={formData.payment}
                  onChange={handleChange}
                  disabled={isSaving}
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

              {/* QUANTITY */}

              <div className="battery-details-field">

                <label htmlFor="battery-quantity">
                  Quantity
                </label>

                <input
                  id="battery-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={formData.quantity}
                  onChange={handleChange}
                  disabled={isSaving}
                />

              </div>

            </div>

          </section>

          {/* ========================================
              PRICING
          ======================================== */}

          <section className="battery-details-section">

            <div className="battery-details-section-title">

              <IndianRupee size={18} />

              <div>
                <h3>
                  Pricing
                </h3>

                <p>
                  Battery purchase and
                  customer pricing
                </p>
              </div>

            </div>

            <div className="battery-details-form-grid two">

              {/* COST PRICE */}

              <div className="battery-details-field">

                <label htmlFor="battery-cost-price">
                  Cost Price
                </label>

                <div className="battery-details-money">

                  <IndianRupee size={15} />

                  <input
                    id="battery-cost-price"
                    name="costPrice"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={formData.costPrice}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={isSaving}
                  />

                </div>

              </div>

              {/* CUSTOMER PRICE */}

              <div className="battery-details-field">

                <label htmlFor="battery-customer-price">
                  Customer Price
                </label>

                <div className="battery-details-money">

                  <IndianRupee size={15} />

                  <input
                    id="battery-customer-price"
                    name="customerPrice"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={formData.customerPrice}
                    onChange={handleChange}
                    placeholder="0"
                    disabled={isSaving}
                  />

                </div>

              </div>

            </div>

          </section>

          {/* ========================================
              SUMMARY
          ======================================== */}

          <div className="battery-details-summary">

            <div>
              <span>
                Total Cost
              </span>

              <strong>
                ₹
                {totalCost.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Customer Sale
              </span>

              <strong>
                ₹
                {totalSale.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Estimated Profit
              </span>

              <strong>
                ₹
                {estimatedProfit.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Payment
              </span>

              <strong>
                {formData.payment}
              </strong>
            </div>

          </div>

          {/* ========================================
              ERROR
          ======================================== */}

          {saveError && (
            <div
              style={{
                marginTop: "14px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {saveError}
            </div>
          )}

          {/* ========================================
              FOOTER
          ======================================== */}

          <div className="battery-details-footer">

            <button
              type="button"
              className="battery-details-cancel"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="battery-details-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default BatteryDetailsModal;