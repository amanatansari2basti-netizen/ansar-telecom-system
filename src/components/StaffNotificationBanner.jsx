import { useEffect, useState, useRef } from "react";
import {
  Volume2,
  VolumeX,
  X,
  Bike,
  Wrench,
  ChevronRight,
  Phone,
  MapPin,
  Smartphone,
} from "lucide-react";
import { playFullVolumeAlert } from "../utils/soundAlertService";

/**
 * StaffNotificationBanner
 * Shows an unmissable top overlay with sound countdown and quick action
 */
const StaffNotificationBanner = ({ alert, onDismiss, onAction }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [isMuted, setIsMuted] = useState(false);
  const stopSoundRef = useRef(null);

  useEffect(() => {
    if (!alert) return;

    // Reset countdown
    setSecondsRemaining(5);
    setIsMuted(false);

    // Play 5-second full volume alert with speech
    const speechText =
      alert.type === "job_assigned"
        ? `Attention! New repair job ${alert.jobId || ""} assigned. ${alert.customerName ? `Customer ${alert.customerName}` : ""}.`
        : `Attention! New pick and drop booked. ${alert.customerName ? `Customer ${alert.customerName}` : ""}.`;

    const stopFn = playFullVolumeAlert({
      durationMs: 5000,
      type: alert.type,
      speechText,
      onComplete: () => {
        setIsMuted(true);
      },
    });

    stopSoundRef.current = stopFn;

    // 1-second countdown interval
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (stopSoundRef.current) {
        stopSoundRef.current();
      }
    };
  }, [alert]);

  const handleStopSoundOnly = () => {
    if (stopSoundRef.current) {
      stopSoundRef.current();
      stopSoundRef.current = null;
    }
    setIsMuted(true);
    setSecondsRemaining(0);
  };

  const handleClose = () => {
    handleStopSoundOnly();
    if (onDismiss) onDismiss();
  };

  const handleActionClick = () => {
    handleStopSoundOnly();
    if (onAction) onAction(alert);
    else if (onDismiss) onDismiss();
  };

  if (!alert) return null;

  const isPickDrop = alert.type === "pickup_booked";
  const title = isPickDrop
    ? "🚨 NAYA PICK & DROP BOOKING AAYA HAI!"
    : "🔔 NAYA REPAIR JOB ASSIGNED!";

  const accentColor = isPickDrop ? "#f97316" : "#2563eb";
  const bgGradient = isPickDrop
    ? "linear-gradient(135deg, #7c2d12 0%, #1c1917 100%)"
    : "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)";

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "92%",
        maxWidth: "680px",
        zIndex: 999999,
        background: bgGradient,
        color: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.65), 0 0 0 3px rgba(255, 255, 255, 0.15)",
        border: `2px solid ${accentColor}`,
        padding: "16px 20px",
        animation: "notificationPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes notificationPopIn {
          from { opacity: 0; transform: translate(-50%, -24px) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes alertPulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(249, 115, 22, 0.5); }
          50% { box-shadow: 0 0 30px rgba(249, 115, 22, 0.85); }
        }
        @keyframes soundWaveBar {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }
      `}</style>

      {/* Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: accentColor,
              display: "grid",
              placeItems: "center",
              boxShadow: `0 0 12px ${accentColor}`,
            }}
          >
            {isPickDrop ? <Bike size={22} color="#fff" /> : <Wrench size={22} color="#fff" />}
          </div>

          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "800",
                letterSpacing: "0.4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{title}</span>
              {alert.jobId && (
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  #{alert.jobId}
                </span>
              )}
            </div>

            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)" }}>
              {isPickDrop
                ? "Customer online Pick & Drop portal se book hua hai"
                : "Aapke bench par abhi naya repair work assign kiya gaya hai"}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            border: "none",
            borderRadius: "8px",
            width: "32px",
            height: "32px",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            cursor: "pointer",
            flexShrink: 0,
          }}
          title="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>

      {/* Details Box */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.35)",
          borderRadius: "10px",
          padding: "10px 14px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "8px 16px",
          fontSize: "12px",
          marginBottom: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {alert.customerName && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Customer:</span>
            <strong>{alert.customerName}</strong>
          </div>
        )}

        {alert.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Phone size={13} style={{ color: "rgba(255, 255, 255, 0.6)" }} />
            <span>{alert.phone}</span>
          </div>
        )}

        {alert.device && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Smartphone size={13} style={{ color: "rgba(255, 255, 255, 0.6)" }} />
            <span>{alert.device}</span>
          </div>
        )}

        {alert.problem && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", gridColumn: "1 / -1" }}>
            <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Problem:</span>
            <span style={{ color: "#fef08a", fontWeight: 600 }}>{alert.problem}</span>
          </div>
        )}

        {alert.address && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", gridColumn: "1 / -1" }}>
            <MapPin size={13} style={{ color: "rgba(255, 255, 255, 0.6)", flexShrink: 0 }} />
            <span style={{ color: "rgba(255, 255, 255, 0.85)" }}>{alert.address}</span>
          </div>
        )}
      </div>

      {/* Footer Controls: Audio Status & Action Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {/* Sound status indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isMuted && secondsRemaining > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(239, 68, 68, 0.25)",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#fca5a5",
                border: "1px solid rgba(239, 68, 68, 0.4)",
              }}
            >
              <Volume2 size={14} className="animate-pulse" />
              <span>Full Volume Alert ({secondsRemaining}s)</span>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "14px" }}>
                <span style={{ width: "3px", background: "#ef4444", animation: "soundWaveBar 0.5s infinite" }} />
                <span style={{ width: "3px", background: "#ef4444", animation: "soundWaveBar 0.5s infinite 0.15s" }} />
                <span style={{ width: "3px", background: "#ef4444", animation: "soundWaveBar 0.5s infinite 0.3s" }} />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              <VolumeX size={13} />
              <span>Audio completed</span>
            </div>
          )}

          {!isMuted && (
            <button
              type="button"
              onClick={handleStopSoundOnly}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Stop Sound
            </button>
          )}
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={handleActionClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#ffffff",
              color: "#0f172a",
              border: "none",
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span>{isPickDrop ? "Open Pickup Request" : "Open My Job"}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffNotificationBanner;
