import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import {
  Printer,
  CheckCircle2,
  X,
  ExternalLink,
  Receipt,
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

  const handlePrint = useCallback(() => {
    const ticketEl = printAreaRef.current;
    if (!ticketEl) {
      window.print();
      return;
    }

    // Clean up old print frame if still present
    const oldFrame = document.getElementById("ansar-receipt-print-frame");
    if (oldFrame) {
      try {
        oldFrame.remove();
      } catch {
        // ignore
      }
    }

    // Create an isolated hidden iframe for clean, unclipped print preview
    const iframe = document.createElement("iframe");
    iframe.id = "ansar-receipt-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const is58 = paperWidth === "58mm";
    const isDesktop = paperWidth === "desktop";
    const receiptWidth = is58 ? "56mm" : isDesktop ? "86mm" : "76mm";
    const baseFontSize = is58 ? "10px" : "11.5px";

    const ticketHtml = ticketEl.outerHTML;

    try {
      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return;
      }

      doc.open();
      doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt_${jobId}</title>
  <style>
    @page {
      size: ${is58 ? "58mm auto" : isDesktop ? "auto" : "80mm auto"};
      margin: ${isDesktop ? "6mm auto" : "3mm 2mm"};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
    }
    .thermal-ticket-body {
      width: ${receiptWidth};
      max-width: 100%;
      margin: 0 auto;
      padding: 6px 6px;
      font-size: ${baseFontSize};
      line-height: 1.35;
      color: #000000 !important;
      background: #ffffff !important;
      border: none !important;
      box-shadow: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .ticket-header-compact {
      text-align: center;
      margin-bottom: 3px;
    }
    .ticket-brand-name {
      font-size: ${is58 ? "14px" : "16px"};
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #000000;
    }
    .ticket-brand-sub {
      font-size: ${is58 ? "7.5px" : "8.5px"};
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 1px 0 2px 0;
    }
    .ticket-brand-contact {
      font-size: ${is58 ? "7.5px" : "8.5px"};
      line-height: 1.25;
      color: #111;
    }
    .ticket-line-dashed {
      border-top: 1px dashed #000000;
      margin: 5px 0;
    }
    .ticket-job-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1px 0;
    }
    .ticket-job-tag {
      font-size: ${is58 ? "13px" : "15px"};
      font-weight: 900;
      color: #000000;
    }
    .ticket-date-tag {
      font-size: ${is58 ? "8px" : "9px"};
      font-weight: 700;
      color: #000000;
    }
    .ticket-details-compact {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: ${is58 ? "9px" : "10px"};
    }
    .ticket-compact-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      line-height: 1.3;
    }
    .tk-lbl {
      font-weight: 700;
      min-width: ${is58 ? "48px" : "56px"};
      flex-shrink: 0;
      color: #000000;
    }
    .tk-val {
      flex: 1;
      word-break: break-word;
      color: #000000;
    }
    .font-bold {
      font-weight: 700;
    }
    .ticket-finance-compact {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
      font-size: ${is58 ? "9px" : "10px"};
    }
    .ticket-fin-col {
      display: flex;
      flex-direction: column;
    }
    .fin-lbl {
      font-size: ${is58 ? "7.5px" : "8.5px"};
      color: #222;
      font-weight: 600;
    }
    .fin-val {
      font-weight: 700;
      font-size: ${is58 ? "9.5px" : "11px"};
      color: #000000;
    }
    .due-col {
      text-align: right;
    }
    .fin-val-due {
      font-weight: 900;
      font-size: ${is58 ? "12px" : "13.5px"};
      color: #000000;
    }
    .ticket-qr-terms-flex {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 3px 0;
    }
    .ticket-qr-compact-box {
      text-align: center;
      flex-shrink: 0;
    }
    .ticket-qr-img-compact {
      width: ${is58 ? "48px" : "58px"};
      height: ${is58 ? "48px" : "58px"};
      display: block;
      border: 1px solid #000;
      padding: 1px;
    }
    .ticket-qr-subtext {
      font-size: 7px;
      font-weight: 800;
      display: block;
      margin-top: 2px;
      color: #000;
    }
    .ticket-terms-compact {
      flex: 1;
      font-size: ${is58 ? "7.5px" : "8px"};
      line-height: 1.25;
      color: #000;
    }
    .terms-bold {
      font-weight: 800;
      margin-bottom: 2px;
      text-decoration: underline;
    }
    .terms-line {
      margin-bottom: 1px;
    }
    .ticket-footer-compact {
      text-align: center;
      font-size: ${is58 ? "8px" : "9.5px"};
      font-weight: 800;
      margin-top: 3px;
      color: #000;
    }
  </style>
</head>
<body>
  ${ticketHtml}
</body>
</html>`);
      doc.close();

      const executePrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.error("Iframe print error, calling window.print():", printErr);
          window.print();
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 4000);
        }
      };

      // Ensure QR image is loaded inside iframe
      const imgs = doc.getElementsByTagName("img");
      if (imgs.length > 0) {
        let loaded = 0;
        const checkDone = () => {
          loaded++;
          if (loaded >= imgs.length) {
            setTimeout(executePrint, 120);
          }
        };
        for (let i = 0; i < imgs.length; i++) {
          if (imgs[i].complete) {
            loaded++;
          } else {
            imgs[i].onload = checkDone;
            imgs[i].onerror = checkDone;
          }
        }
        if (loaded >= imgs.length) {
          setTimeout(executePrint, 150);
        }
      } else {
        setTimeout(executePrint, 150);
      }
    } catch (err) {
      console.error("Failed to build print iframe:", err);
      window.print();
    }
  }, [jobId, paperWidth]);

  // Handle auto-print trigger once QR code is ready
  useEffect(() => {
    if (isOpen && autoPrint && qrDataUrl) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, qrDataUrl, handlePrint]);

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
    "";

  return createPortal(
    <div id="thermal-modal-portal">
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
                <h3 className="thermal-header-title">Customer Job Receipt</h3>
                <p className="thermal-header-subtitle">
                  High-contrast receipt for Epson / Desktop & Thermal POS printers with Live QR Tracker
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
                  title="80mm Roll (Thermal POS)"
                >
                  80mm POS
                </button>
                <button
                  type="button"
                  className={`paper-btn ${paperWidth === "58mm" ? "active" : ""}`}
                  onClick={() => setPaperWidth("58mm")}
                  title="58mm Mini Roll (Thermal POS)"
                >
                  58mm POS
                </button>
                <button
                  type="button"
                  className={`paper-btn ${paperWidth === "desktop" ? "active" : ""}`}
                  onClick={() => setPaperWidth("desktop")}
                  title="Epson L3250 / Inkjet / A4 Desktop Slip"
                >
                  A4 / Desktop Slip
                </button>
              </div>

              {/* Print Button */}
              <button
                type="button"
                className="thermal-action-btn print-primary-btn"
                onClick={handlePrint}
              >
                <Printer size={18} />
                Print Receipt
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
              {condition && condition !== "Normal" && (
                <div className="ticket-compact-row">
                  <span className="tk-lbl">Condition:</span>
                  <span className="tk-val">{condition}</span>
                </div>
              )}
              {accList.length > 0 && (
                <div className="ticket-compact-row">
                  <span className="tk-lbl">Items:</span>
                  <span className="tk-val">{accList.join(", ")}</span>
                </div>
              )}
              {technicianName && (
                <div className="ticket-compact-row">
                  <span className="tk-lbl">Tech:</span>
                  <span className="tk-val">{technicianName}</span>
                </div>
              )}
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
  </div>,
  document.body
);
};

export default ThermalReceiptModal;
