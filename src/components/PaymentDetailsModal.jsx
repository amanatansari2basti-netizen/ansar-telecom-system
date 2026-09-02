import { useEffect, useState } from "react";

import {
  CheckCircle2,
  IndianRupee,
  Loader2,
  Save,
  User,
  X,
} from "lucide-react";

import "../paymentDetailsModal.css";

const PaymentDetailsModal = ({
  isOpen,
  onClose,
  record,
  onUpdate,
}) => {
  /* ========================================
     FORM STATE
  ======================================== */

  const [formData, setFormData] = useState({
    totalAmount: "",
    receivedAmount: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  /* ========================================
     LOAD SELECTED PAYMENT
  ======================================== */

  useEffect(() => {
    if (!record || !isOpen) {
      return;
    }

    setFormData({
      totalAmount:
        record.amount ?? "",
      receivedAmount:
        record.advance ?? "",
    });

    setSaveError("");
    setIsSaving(false);
  }, [record, isOpen]);

  /* ========================================
     DON'T RENDER CLOSED MODAL
  ======================================== */

  if (!isOpen || !record) {
    return null;
  }

  /* ========================================
     PAYMENT CALCULATIONS
  ======================================== */

  const totalAmount = Math.max(
    Number(formData.totalAmount) || 0,
    0
  );

  const receivedAmount = Math.max(
    Number(formData.receivedAmount) || 0,
    0
  );

  const pendingAmount = Math.max(
    totalAmount - receivedAmount,
    0
  );

  const paymentStatus =
    totalAmount > 0 &&
    receivedAmount >= totalAmount
      ? "Paid"
      : receivedAmount > 0
        ? "Advance Paid"
        : "Pending";

  /* ========================================
     INPUT CHANGE
  ======================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setSaveError("");

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* ========================================
     MARK FULL PAYMENT
  ======================================== */

  const handleMarkPaid = () => {
    setSaveError("");

    const bill =
      Math.max(
        Number(formData.totalAmount) || 0,
        0
      );

    setFormData((previous) => ({
      ...previous,
      receivedAmount: String(bill),
    }));
  };

  /* ========================================
     SAVE PAYMENT
  ======================================== */

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setSaveError("");

    if (totalAmount < 0) {
      setSaveError(
        "Total bill cannot be negative."
      );
      return;
    }

    if (receivedAmount < 0) {
      setSaveError(
        "Received amount cannot be negative."
      );
      return;
    }

    /*
     * For the current repair workflow,
     * received payment should not exceed
     * the total repair bill.
     */

    if (
      totalAmount > 0 &&
      receivedAmount > totalAmount
    ) {
      setSaveError(
        "Received amount cannot be greater than the total bill."
      );
      return;
    }

    /*
     * Don't allow received money against
     * a zero-value bill.
     */

    if (
      totalAmount === 0 &&
      receivedAmount > 0
    ) {
      setSaveError(
        "Please enter the total bill before adding received payment."
      );
      return;
    }

    const updatedRecord = {
      ...record,

      /*
       * Important:
       * firestoreId coming from Payments.jsx
       * remains inside this object.
       */

      amount: totalAmount,
      advance: receivedAmount,

      pending: pendingAmount,
      payment: paymentStatus,
    };

    try {
      setIsSaving(true);

      /*
       * Payments.jsx performs the actual
       * Firestore update.
       */

      await onUpdate?.(updatedRecord);

      /*
       * Payments.jsx currently closes the
       * modal after successful Firestore save.
       *
       * So we DO NOT call onClose() here.
       */
    } catch (error) {
      console.error(
        "Unable to save payment:",
        error
      );

      setSaveError(
        "Payment could not be saved. Please try again."
      );

      setIsSaving(false);
    }
  };

  /* ========================================
     CLOSE MODAL
  ======================================== */

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    setSaveError("");
    onClose?.();
  };

  return (
    <div
      className="payment-details-overlay"
      onMouseDown={handleClose}
    >
      <div
        className="payment-details-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* ========================================
            HEADER
        ======================================== */}

        <div className="payment-details-header">

          <div>
            <span className="payment-details-eyebrow">
              Payment Record
            </span>

            <h2>
              {record.id || "Repair Job"}
            </h2>

            <p>
              Update billing and received
              payment information.
            </p>
          </div>

          <button
            type="button"
            className="payment-details-close"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close payment details"
          >
            <X size={20} />
          </button>

        </div>

        {/* ========================================
            CONTENT
        ======================================== */}

        <div className="payment-details-content">

          {/* ========================================
              CUSTOMER + DEVICE
          ======================================== */}

          <section className="payment-details-section">

            <div className="payment-details-section-title">

              <User size={18} />

              <div>
                <h3>
                  Customer & Device
                </h3>

                <p>
                  Linked repair job information
                </p>
              </div>

            </div>

            <div className="payment-details-info-grid">

              <div>
                <span>
                  Customer
                </span>

                <strong>
                  {record.customer ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Device
                </span>

                <strong>
                  {record.device ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {record.phone ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Job Status
                </span>

                <strong>
                  {record.status ||
                    "Pending"}
                </strong>
              </div>

            </div>

          </section>

          {/* ========================================
              PAYMENT UPDATE
          ======================================== */}

          <section className="payment-details-section">

            <div className="payment-details-section-title">

              <IndianRupee size={18} />

              <div>
                <h3>
                  Payment Update
                </h3>

                <p>
                  Edit total bill and amount
                  received
                </p>
              </div>

            </div>

            <div className="payment-details-form-grid">

              {/* TOTAL BILL */}

              <div className="payment-details-field">

                <label htmlFor="payment-total-amount">
                  Total Bill
                </label>

                <div className="payment-details-money">

                  <IndianRupee size={15} />

                  <input
                    id="payment-total-amount"
                    name="totalAmount"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={
                      formData.totalAmount
                    }
                    onChange={handleChange}
                    placeholder="0"
                    disabled={isSaving}
                  />

                </div>

              </div>

              {/* RECEIVED */}

              <div className="payment-details-field">

                <label htmlFor="payment-received-amount">
                  Received Amount
                </label>

                <div className="payment-details-money">

                  <IndianRupee size={15} />

                  <input
                    id="payment-received-amount"
                    name="receivedAmount"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={
                      formData.receivedAmount
                    }
                    onChange={handleChange}
                    placeholder="0"
                    disabled={isSaving}
                  />

                </div>

              </div>

            </div>

            {/* MARK FULL PAYMENT */}

            <button
              type="button"
              className="payment-mark-paid"
              onClick={handleMarkPaid}
              disabled={
                isSaving ||
                totalAmount <= 0
              }
            >
              <CheckCircle2 size={16} />

              Mark Full Payment Received
            </button>

          </section>

          {/* ========================================
              PAYMENT SUMMARY
          ======================================== */}

          <div className="payment-details-summary">

            <div>
              <span>
                Total Bill
              </span>

              <strong>
                ₹
                {totalAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Received
              </span>

              <strong className="payment-summary-received">
                ₹
                {receivedAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong
                className={
                  pendingAmount > 0
                    ? "payment-summary-pending"
                    : "payment-summary-clear"
                }
              >
                ₹
                {pendingAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {paymentStatus}
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

          <div className="payment-details-footer">

            <button
              type="button"
              className="payment-details-cancel"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="payment-details-save"
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
                  Save Payment
                </>
              )}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PaymentDetailsModal;