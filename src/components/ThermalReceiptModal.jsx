import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Printer,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  X,
  ExternalLink,
  Receipt,
  Download,
  Share2,
} from "lucide-react";
import "./thermalReceiptModal.css";

/* =========================================================
   HELPERS
========================================================= */

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatINR = (val) => {
  return "₹" + toNumber(val).toLocaleString("en-IN");
};

const formatDate = (val) => {
  if (!val) {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  try {
    const d = typeof val?.toDate === "function" ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) {
      return new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date().toLocaleDateString("en-IN");
  }
};

/**
 * ThermalReceiptModal
 * 
 * Features:
 * 1. 80mm / 58mm thermal-printer optimized high-contrast B&W ticket
 * 2. Prominent bold Repair Job ID (e.g. AT-1087)
 * 3. Scannable QR Code that routes straight to live repair tracker (/track?jobId=...&phone=...)
 * 4. Automatic auto-print popup trigger when opened after job intake
 * 5. Full breakdown of Device, Issue, Accessories, Estimate, Advance, and Terms
 */
const ThermalReceiptModal = ({
  isOpen,
  onClose,
  job,
  autoPrint = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [paperWidth, setPaperWidth] = useState("80mm"); // "80mm" or "58mm"
  const printAreaRef = useRef(null);

  const jobId = job?.id || "AT-NEW";
  const customerPhone = job?.phone || job?.mobileNumber || job?.customerPhone || "";
  const trackingUrl = `${window.location.origin}/track?jobId=${encodeURIComponent(jobId)}&phone=${encodeURIComponent(customerPhone)}`;

  const customerAddress = (() => {
    const raw = job?.customerAddress || job?.pickupAddress || job?.address;
    if (!raw) return "";
    if (typeof raw === "string") return raw.trim();
    if (typeof raw === "object") {
      return [raw.address, raw.landmark ? `Near ${raw.landmark}` : "", raw.city, raw.pincode].filter(Boolean).join(", ");
    }
    return String(raw);
  })();

  // Generate crisp QR code on mount/job change
  useEffect(() => {
    if (!isOpen || !jobId) return;

    QRCode.toDataURL(
      trackingUrl,
      {
        width: 180,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, jobId, trackingUrl]);

  // Handle auto-print trigger
  useEffect(() => {
    if (isOpen && autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !job) return null;

  const customerName = job.customerName || job.customer || "Valued Customer";
  const device =
    job.device ||
    job.deviceModel ||
    `${job.brand || ""} ${job.model || ""}`.trim() ||
    "Smartphone Device";
  const imei = job.imei ? `IMEI: ${job.imei}` : "";
  const problem = job.reportedProblem || job.problem || job.issue || "Diagnostic & Repair";
  const condition = job.deviceCondition || "Normal";
  const conditionNotes = job.conditionNotes || "";

  // Accessories list
  const accList = [];
  if (job.accessories) {
    if (job.accessories.charger) accList.push("Charger");
    if (job.accessories.sim) accList.push("SIM Card");
    if (job.accessories.memoryCard) accList.push("SD Card");
    if (job.accessories.cover) accList.push("Back Cover");
    if (job.accessories.box) accList.push("Original Box");
    if (job.accessories.other && job.otherAccessory) {
      accList.push(job.otherAccessory);
    } else if (job.accessories.other) {
      accList.push("Other Accessory");
    }
  }

  const estimatedAmount = toNumber(
    job.estimatedCharge ??
    job.estimate?.totalAmount ??
    job.amount ??
    job.totalAmount ??
    0
  );

  const advancePaid = toNumber(
    job.advanceReceived ??
    job.receivedAmount ??
    job.paidAmount ??
    job.advance ??
    0
  );

  const balanceDue = Math.max(estimatedAmount - advancePaid, 0);

  const technicianName =
    job.technicianName ||
    job.technician ||
    job.assignedTechnician ||
    "Workshop Master Bench";

  const priority = job.priority || "Normal";

  return (
    <div className="thermal-modal-overlay" onMouseDown={onClose}>
      <div
        className="thermal-modal-container"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Screen Only) */}
        <div className="thermal-screen-header">
          <div className="thermal-header-left">
            <div className="thermal-icon-badge">
              <Receipt size={22} className="text-blue-600" />
            </div>
            <div>
              <h3 className="thermal-header-title">Customer Thermal Job Receipt</h3>
              <p className="thermal-header-subtitle">
                High-contrast B&W receipt for 58mm/80mm POS thermal printers with Live QR Tracker
              </p>
            </div>
          </div>

          <div className="thermal-header-actions">
            {/* Paper Size Selector */}
            <div className="paper-size-toggle">
              <button
                type="button"
                className={`paper-btn ${paperWidth === "80mm" ? "active" : ""}`}
                onClick={() => setPaperWidth("80mm")}
              >
                80mm Standard POS
              </button>
              <button
                type="button"
                className={`paper-btn ${paperWidth === "58mm" ? "active" : ""}`}
                onClick={() => setPaperWidth("58mm")}
              >
                58mm Mini POS
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              className="thermal-action-btn print-primary-btn"
              onClick={handlePrint}
            >
              <Printer size={18} />
              Print Receipt (POS)
            </button>

            {/* Close Button */}
            <button
              type="button"
              className="thermal-close-btn"
              onClick={onClose}
              title="Close Receipt"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Receipt Preview Canvas Area */}
        <div className="thermal-preview-canvas">
          {/* Printable Ticket */}
          <div
            ref={printAreaRef}
            id="ansar-thermal-receipt-ticket"
            className={`thermal-ticket-body paper-${paperWidth}`}
          >
            {/* Store Branding Header (Ansar Telecom) */}
            <div className="ticket-header-compact">
              <div className="ticket-brand-name">ANSAR TELECOM</div>
              <div className="ticket-brand-sub">SMARTPHONE REPAIR & SERVICE CENTER</div>
              <div className="ticket-brand-contact">
                District Hospital Road, Beside Sulaxmi Tower, Basti 272002
                <br />
                Phone: 9415172051 | Prop: Aqib Ansari (9450576786)
              </div>
            </div>

            <div className="ticket-line-dashed" />

            {/* HIGH-IMPACT JOB ID & DATE */}
            <div className="ticket-job-row">
              <span className="ticket-job-tag">JOB: {jobId}</span>
              <span className="ticket-date-tag">{formatDate(job.createdAt)}</span>
            </div>

            <div className="ticket-line-dashed" />

            {/* Customer, Device & Problem (Compact) */}
            <div className="ticket-details-compact">
              <div className="ticket-compact-row">
                <span className="tk-lbl">Customer:</span>
                <span className="tk-val font-bold">
                  {customerName} {customerPhone ? `(${customerPhone})` : ""}
                </span>
              </div>
              <div className="ticket-compact-row">
                <span className="tk-lbl">Device:</span>
                <span className="tk-val font-bold">{device}</span>
              </div>
              {imei && (
                <div className="ticket-compact-row">
                  <span className="tk-lbl">IMEI/SN:</span>
                  <span className="tk-val">{imei.replace("IMEI: ", "")}</span>
                </div>
              )}
              <div className="ticket-compact-row">
                <span className="tk-lbl">Problem:</span>
                <span className="tk-val">{problem}</span>
              </div>
            </div>

            <div className="ticket-line-dashed" />

            {/* Financials / Billing Summary */}
            <div className="ticket-finance-compact">
              <div className="ticket-fin-col">
                <span className="fin-lbl">Estimate:</span>
                <span className="fin-val">{formatINR(estimatedAmount)}</span>
              </div>
              <div className="ticket-fin-col">
                <span className="fin-lbl">Advance:</span>
                <span className="fin-val">{formatINR(advancePaid)}</span>
              </div>
              <div className="ticket-fin-col due-col">
                <span className="fin-lbl font-bold">Balance:</span>
                <span className="fin-val-due">{formatINR(balanceDue)}</span>
              </div>
            </div>

            <div className="ticket-line-dashed" />

            {/* Compact QR + Essential Terms */}
            <div className="ticket-qr-terms-flex">
              {qrDataUrl ? (
                <div className="ticket-qr-compact-box">
                  <img
                    src={qrDataUrl}
                    alt={`Track ${jobId}`}
                    className="ticket-qr-img-compact"
                  />
                  <span className="ticket-qr-subtext">Scan to Track</span>
                </div>
              ) : null}
              <div className="ticket-terms-compact">
                <div className="terms-bold">Terms & Conditions:</div>
                <div className="terms-line">• Original receipt required for pickup</div>
                <div className="terms-line">• No warranty on water/physical damage</div>
                <div className="terms-line">• Check device at handover</div>
              </div>
            </div>

            <div className="ticket-line-dashed" />

            {/* Professional Footer */}
            <div className="ticket-footer-compact">
              Thank you for choosing Ansar Telecom!
            </div>
          </div>
        </div>

        {/* Bottom Screen Notice & Quick Tracking Link */}
        <div className="thermal-screen-footer">
          <div className="thermal-footer-left">
            <span className="flex items-center gap-1 text-slate-600 text-xs">
              <CheckCircle2 size={15} className="text-green-600 inline" />
              Receipt is saved permanently in history and can be re-printed anytime from the Job Details menu.
            </span>
          </div>

          <div className="thermal-footer-right">
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="thermal-track-link"
            >
              <ExternalLink size={14} />
              Open Customer Live Tracker
            </a>
            <button
              type="button"
              className="thermal-secondary-btn"
              onClick={onClose}
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptModal;
