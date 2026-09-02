import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  IndianRupee,
  PackageCheck,
  Smartphone,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import "./deliveryModal.css";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const DeliveryModal = ({
  isOpen,
  onClose,
  job,
}) => {
  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [deliveryMethod, setDeliveryMethod] =
    useState("Customer Pickup");

  const [receivedNow, setReceivedNow] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const totalAmount = useMemo(() => {
    return toNumber(
      job?.estimate?.totalAmount ??
        job?.amount ??
        job?.estimatedCharge ??
        job?.totalAmount ??
        0
    );
  }, [job]);

  const alreadyReceived = useMemo(() => {
    return toNumber(
      job?.receivedAmount ??
        job?.paidAmount ??
        job?.advance ??
        0
    );
  }, [job]);

  const balance = Math.max(
    totalAmount - alreadyReceived,
    0
  );

  if (!isOpen || !job) {
    return null;
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(toNumber(value));

  const customerName =
    job.customer ||
    job.customerName ||
    "Customer";

  const phone =
    job.phone ||
    job.mobileNumber ||
    job.customerPhone ||
    "No number";

  const device =
    job.device ||
    `${job.brand || ""} ${
      job.model || ""
    }`.trim() ||
    "Device";

  const handleClose = () => {
    if (saving) return;

    setPaymentMethod("Cash");
    setDeliveryMethod("Customer Pickup");
    setReceivedNow("");
    setNotes("");
    setError("");

    onClose?.();
  };

  const handleDeliver = async () => {
    setError("");

    const currentPayment =
      toNumber(receivedNow);

    if (currentPayment < 0) {
      setError(
        "Received amount cannot be negative."
      );
      return;
    }

    if (currentPayment > balance) {
      setError(
        `Maximum remaining balance is ${formatCurrency(
          balance
        )}.`
      );
      return;
    }

    const totalReceived =
      alreadyReceived + currentPayment;

    const remainingBalance =
      Math.max(
        totalAmount - totalReceived,
        0
      );

    if (remainingBalance > 0) {
      const confirmed =
        window.confirm(
          `${formatCurrency(
            remainingBalance
          )} will still remain unpaid. Deliver device anyway?`
        );

      if (!confirmed) {
        return;
      }
    }

    const confirmedDelivery =
      window.confirm(
        `Confirm delivery of ${device} to ${customerName}?`
      );

    if (!confirmedDelivery) {
      return;
    }

    try {
      setSaving(true);

      const jobRef = doc(
        db,
        "repairJobs",
        job.id
      );

      await updateDoc(jobRef, {
        /*
          Legacy workflow compatibility
        */
        status: "Completed",

        /*
          V2 workflow
        */
        repairStage: "Delivered",

        customerStatus:
          "Your device has been delivered successfully.",

        customerStatusCode:
          "DELIVERED",

        /*
          Payment
        */
        amount: totalAmount,

        totalAmount,

        receivedAmount:
          totalReceived,

        paidAmount:
          totalReceived,

        balanceAmount:
          remainingBalance,

        paymentStatus:
          remainingBalance <= 0
            ? "Paid"
            : totalReceived > 0
            ? "Partial"
            : "Pending",

        paymentMethod:
          currentPayment > 0
            ? paymentMethod
            : job.paymentMethod || "",

        lastPaymentAmount:
          currentPayment,

        lastPaymentAt:
          currentPayment > 0
            ? serverTimestamp()
            : null,

        /*
          Delivery
        */
        "delivery.status":
          "Delivered",

        "delivery.method":
          deliveryMethod,

        "delivery.deliveredAt":
          serverTimestamp(),

        "delivery.deliveredBy":
          "Reception",

        "delivery.notes":
          notes.trim(),

        deliveredAt:
          serverTimestamp(),

        deliveredBy:
          "Reception",

        deliveryMethod,

        /*
          General
        */
        completedAt:
          job.completedAt ||
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      });

      setPaymentMethod("Cash");
      setDeliveryMethod(
        "Customer Pickup"
      );
      setReceivedNow("");
      setNotes("");
      setError("");

      onClose?.();
    } catch (err) {
      console.error(
        "Device delivery failed:",
        err
      );

      setError(
        err?.message ||
          "Unable to complete delivery."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="delivery-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="delivery-modal">

        {/* HEADER */}

        <div className="delivery-header">
          <div className="delivery-title">
            <div className="delivery-title-icon">
              <PackageCheck size={21} />
            </div>

            <div>
              <span>
                FINAL HANDOVER
              </span>

              <h2>
                Deliver Device
              </h2>

              <p>
                Complete payment and
                customer handover.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="delivery-close"
            onClick={handleClose}
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        {/* JOB */}

        <div className="delivery-job">
          <div className="delivery-job-id">
            <span>JOB ID</span>
            <strong>{job.id}</strong>
          </div>

          <div className="delivery-job-data">
            <div>
              <UserRound size={15} />

              <span>
                <small>Customer</small>
                <strong>
                  {customerName}
                </strong>
                <em>{phone}</em>
              </span>
            </div>

            <div>
              <Smartphone size={15} />

              <span>
                <small>Device</small>
                <strong>
                  {device}
                </strong>
                <em>
                  Ready for delivery
                </em>
              </span>
            </div>
          </div>
        </div>

        {/* PAYMENT SUMMARY */}

        <section className="delivery-section">
          <div className="delivery-section-title">
            <IndianRupee size={16} />

            <div>
              <strong>
                Payment Summary
              </strong>

              <span>
                Verify remaining customer
                balance.
              </span>
            </div>
          </div>

          <div className="delivery-money-grid">
            <div>
              <span>Total</span>
              <strong>
                {formatCurrency(
                  totalAmount
                )}
              </strong>
            </div>

            <div>
              <span>
                Already Received
              </span>

              <strong>
                {formatCurrency(
                  alreadyReceived
                )}
              </strong>
            </div>

            <div
              className={
                balance > 0
                  ? "balance-due"
                  : "balance-paid"
              }
            >
              <span>Balance</span>

              <strong>
                {formatCurrency(
                  balance
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* RECEIVE PAYMENT */}

        {balance > 0 ? (
          <section className="delivery-section">
            <div className="delivery-section-title">
              <WalletCards size={16} />

              <div>
                <strong>
                  Collect Payment
                </strong>

                <span>
                  Enter payment received
                  during handover.
                </span>
              </div>
            </div>

            <div className="delivery-field">
              <label>
                Amount Received Now
              </label>

              <div className="delivery-amount-input">
                <IndianRupee
                  size={15}
                />

                <input
                  type="number"
                  min="0"
                  max={balance}
                  value={receivedNow}
                  onChange={(event) => {
                    setReceivedNow(
                      event.target.value
                    );

                    setError("");
                  }}
                  placeholder={`${balance}`}
                />
              </div>

              <button
                type="button"
                className="delivery-full-btn"
                onClick={() =>
                  setReceivedNow(
                    String(balance)
                  )
                }
              >
                Full Balance
              </button>
            </div>

            <div className="delivery-field">
              <label>
                Payment Method
              </label>

              <div className="delivery-options">
                {[
                  "Cash",
                  "UPI",
                  "Card",
                ].map((method) => (
                  <button
                    type="button"
                    key={method}
                    className={
                      paymentMethod ===
                      method
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPaymentMethod(
                        method
                      )
                    }
                  >
                    <CreditCard
                      size={14}
                    />

                    {method}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="delivery-paid-banner">
            <CheckCircle2 size={18} />

            <div>
              <strong>
                Payment Complete
              </strong>

              <span>
                No remaining balance.
              </span>
            </div>
          </div>
        )}

        {/* DELIVERY METHOD */}

        <section className="delivery-section">
          <div className="delivery-section-title">
            <PackageCheck size={16} />

            <div>
              <strong>
                Delivery Method
              </strong>

              <span>
                How is the device being
                handed over?
              </span>
            </div>
          </div>

          <div className="delivery-options">
            <button
              type="button"
              className={
                deliveryMethod ===
                "Customer Pickup"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setDeliveryMethod(
                  "Customer Pickup"
                )
              }
            >
              Customer Pickup
            </button>

            <button
              type="button"
              className={
                deliveryMethod ===
                "Home Delivery"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setDeliveryMethod(
                  "Home Delivery"
                )
              }
            >
              Home Delivery
            </button>
          </div>

          <div className="delivery-field">
            <label>
              Handover Notes
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Optional notes..."
            />
          </div>
        </section>

        {error && (
          <div className="delivery-error">
            {error}
          </div>
        )}

        {/* FOOTER */}

        <div className="delivery-footer">
          <button
            type="button"
            className="delivery-cancel"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="delivery-confirm"
            onClick={
              handleDeliver
            }
            disabled={saving}
          >
            <CheckCircle2
              size={16}
            />

            {saving
              ? "Completing..."
              : "Confirm Delivery"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;