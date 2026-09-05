import React, { useEffect, useState } from "react";
import {
  Bike,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Navigation,
  Phone,
  Radio,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  Wrench,
  X,
} from "lucide-react";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const SHOP_LOCATION = {
  name: "Ansar Telecom Service Center",
  address: "Gandhi Nagar, Basti, UP - 272001",
  latitude: 26.7998,
  longitude: 82.7635,
};

const getStageDetails = (status, taskType = "pickup", language = "en") => {
  const isDelivery = taskType === "delivery";

  if (isDelivery) {
    switch (status) {
      case "delivery_rider_assigned":
        return {
          stepIndex: 1,
          title: language === "hi" ? "डिलीवरी राइडर असाइन किया गया" : "Delivery Rider Assigned",
          desc: language === "hi" ? "राइडर जल्द ही डिलीवरी के लिए निकलेगा।" : "Rider assigned and preparing for dispatch.",
          color: "#f59e0b",
          progress: 25,
        };
      case "delivery_accepted":
      case "out_for_delivery":
      case "rider_on_the_way":
        return {
          stepIndex: 2,
          title: language === "hi" ? "फोन डिलीवरी के लिए निकल चुका है (Out for Delivery)" : "Out for Delivery",
          desc: language === "hi" ? "राइडर आपका ठीक हुआ फोन लेकर आ रहा है।" : "Rider is en route to deliver your repaired phone.",
          color: "#3b82f6",
          progress: 65,
        };
      case "delivery_arrived":
      case "rider_arrived":
        return {
          stepIndex: 3,
          title: language === "hi" ? "राइडर आपके पते पर पहुँच गया है" : "Rider Arrived at Your Location",
          desc: language === "hi" ? "कृपया अपना फोन प्राप्त करें।" : "Rider has reached your doorstep for delivery.",
          color: "#8b5cf6",
          progress: 90,
        };
      case "delivered":
      case "completed":
        return {
          stepIndex: 4,
          title: language === "hi" ? "फोन सफलतापूर्वक डिलीवर हो गया" : "Delivered Successfully",
          desc: language === "hi" ? "डिलीवरी पूरी हो चुकी है। Ansar Telecom चुनने के लिए धन्यवाद!" : "Device successfully delivered. Thank you for choosing Ansar Telecom!",
          color: "#10b981",
          progress: 100,
        };
      default:
        return {
          stepIndex: 1,
          title: language === "hi" ? "डिलीवरी की तैयारी हो रही है" : "Preparing for Delivery",
          desc: language === "hi" ? "राइडर असाइन किया जा रहा है।" : "Assigning rider for doorstep delivery.",
          color: "#f59e0b",
          progress: 20,
        };
    }
  }

  // Pickup flow
  switch (status) {
    case "rider_assigned":
    case "pending":
      return {
        stepIndex: 1,
        title: language === "hi" ? "पिकअप रिक्वेस्ट दर्ज (राइडर नोटिफिकेशन भेजा गया)" : "Pickup Request Registered",
        desc: language === "hi" ? "राइडर जल्द ही आपकी पिकअप रिक्वेस्ट स्वीकार करेगा।" : "Rider notified. Awaiting acceptance.",
        color: "#f59e0b",
        progress: 15,
      };
    case "rider_accepted":
      return {
        stepIndex: 2,
        title: language === "hi" ? "राइडर ने रिक्वेस्ट स्वीकार की" : "Rider Accepted Request",
        desc: language === "hi" ? "राइडर पिकअप के लिए रवाना हो रहा है।" : "Rider accepted and preparing to head to your location.",
        color: "#3b82f6",
        progress: 35,
      };
    case "rider_on_the_way":
    case "on_the_way":
      return {
        stepIndex: 2,
        title: language === "hi" ? "राइडर आपके पते की ओर आ रहा है" : "Rider Heading to Your Doorstep",
        desc: language === "hi" ? "राइडर लाइव लोकेशन पर आगे बढ़ रहा है।" : "Rider is actively on the way to your pickup address.",
        color: "#3b82f6",
        progress: 55,
      };
    case "rider_arrived":
      return {
        stepIndex: 3,
        title: language === "hi" ? "राइडर आपके पते पर पहुँच गया है" : "Rider Arrived at Doorstep",
        desc: language === "hi" ? "राइडर फोन पिकअप के लिए मौजूद है।" : "Rider has arrived at your location for pickup.",
        color: "#8b5cf6",
        progress: 75,
      };
    case "picked_up":
    case "going_to_shop":
    case "in_transit":
      return {
        stepIndex: 4,
        title: language === "hi" ? "फोन पिकअप हो गया — वर्कशॉप के रास्ते में" : "Device Collected — En Route to Lab",
        desc: language === "hi" ? "फोन सुरक्षित रूप से Ansar Telecom वर्कशॉप ले जाया जा रहा है।" : "Device safely collected and moving to Ansar Telecom workshop.",
        color: "#06b6d4",
        progress: 88,
      };
    case "received_at_shop":
    case "at_shop":
    case "completed":
      return {
        stepIndex: 5,
        title: language === "hi" ? "वर्कशॉप में फोन जमा हो गया (रिपेयरिंग शुरू)" : "Received at Workshop (Lab Check)",
        desc: language === "hi" ? "फोन Ansar Telecom सेंटर पहुँच गया है और इंजीनियर जांच कर रहे हैं।" : "Device safely received at Ansar Telecom service center.",
        color: "#10b981",
        progress: 100,
      };
    default:
      return {
        stepIndex: 1,
        title: language === "hi" ? "पिकअप प्रक्रिया जारी है" : "Pickup In Progress",
        desc: language === "hi" ? "राइडर टीम संपर्क में है।" : "Rider operations team is coordinating pickup.",
        color: "#f59e0b",
        progress: 25,
      };
  }
};

export default function LiveRiderTracker({
  jobId,
  initialData = null,
  language = "en",
  onClose = null,
  isModal = false,
}) {
  const [pickupData, setPickupData] = useState(initialData);
  const [repairData, setRepairData] = useState(null);
  const [riderCoords, setRiderCoords] = useState({
    latitude: 26.8010,
    longitude: 82.7600,
  });

  // Realtime Firestore Listener on pickupRequests
  useEffect(() => {
    if (!jobId) return;

    const unsubPickup = onSnapshot(
      doc(db, "pickupRequests", jobId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPickupData(data);
          if (data.riderLocation?.latitude && data.riderLocation?.longitude) {
            setRiderCoords({
              latitude: Number(data.riderLocation.latitude),
              longitude: Number(data.riderLocation.longitude),
            });
          }
        }
      },
      (err) => console.error("Error listening to pickup request:", err)
    );

    const unsubRepair = onSnapshot(
      doc(db, "repairJobs", jobId),
      (snap) => {
        if (snap.exists()) {
          setRepairData(snap.data());
        }
      },
      (err) => console.error("Error listening to repair job:", err)
    );

    return () => {
      unsubPickup();
      unsubRepair();
    };
  }, [jobId]);

  const taskType = pickupData?.taskType || (repairData?.repairStage === "Ready" || repairData?.repairStage === "Delivered" ? "delivery" : "pickup");
  const rawStatus = pickupData?.status || repairData?.riderStatus || "rider_assigned";
  const stage = getStageDetails(rawStatus, taskType, language);

  const riderName =
    pickupData?.assignedRiderName ||
    pickupData?.riderName ||
    repairData?.assignedRiderName ||
    "Ramesh Kumar (Ansar Logistics)";

  const riderPhone =
    pickupData?.assignedRiderPhone ||
    pickupData?.riderPhone ||
    "9876543210";

  const vehicleNo =
    pickupData?.vehicleNumber ||
    "UP-51-AB-4821 (Hero Splendor)";

  const customerName =
    pickupData?.customerName ||
    pickupData?.customer?.name ||
    repairData?.customerName ||
    repairData?.customer ||
    "Customer";

  const customerAddress = (() => {
    const raw =
      pickupData?.address ||
      pickupData?.pickupAddress ||
      repairData?.address ||
      repairData?.pickupAddress ||
      repairData?.customerAddress;
    if (!raw) return "Basti, UP";
    if (typeof raw === "string") return raw.trim();
    if (typeof raw === "object") {
      return (
        [raw.address, raw.landmark ? `Near ${raw.landmark}` : "", raw.city, raw.pincode]
          .filter(Boolean)
          .join(", ") || "Basti, UP"
      );
    }
    return String(raw);
  })();

  const device =
    pickupData?.device ||
    `${pickupData?.brand || ""} ${pickupData?.model || ""}`.trim() ||
    repairData?.device ||
    "Smartphone";

  // Map coordinate interpolation for interactive SVG visualization
  // Base bounds: Shop (26.7998, 82.7635) to Customer (~26.8040, 82.7580)
  const custLat = pickupData?.pickupLocation?.latitude || 26.8045;
  const custLng = pickupData?.pickupLocation?.longitude || 82.7570;

  // Normalized coordinate mapping to SVG box (width 600, height 320)
  const mapWidth = 600;
  const mapHeight = 300;

  const shopX = 100;
  const shopY = 220;

  const custX = 500;
  const custY = 80;

  // Calculate rider's position along the path based on stage progress or coords
  const p = Math.max(0.1, Math.min(0.95, (stage.progress || 30) / 100));
  const riderX = shopX + (custX - shopX) * (taskType === "delivery" ? p : (rawStatus.includes("going_to_shop") || rawStatus.includes("in_transit") ? (1 - (p - 0.5) * 1.5) : p));
  const riderY = shopY + (custY - shopY) * (taskType === "delivery" ? p : (rawStatus.includes("going_to_shop") || rawStatus.includes("in_transit") ? (1 - (p - 0.5) * 1.5) : p)) + Math.sin(p * Math.PI) * -30;

  // Estimated distance and ETA
  const remainingDist = (2.4 * (1 - p)).toFixed(1);
  const remainingTime = Math.max(2, Math.round(12 * (1 - p)));

  const content = (
    <div
      style={{
        background: "#0f1117",
        borderRadius: isModal ? "20px" : "16px",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "18px 22px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "#f4c400",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            <Bike size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "#f4c400", textTransform: "uppercase" }}>
                {taskType === "delivery" ? (language === "hi" ? "लाइव डिलीवरी ट्रैकिंग" : "LIVE DELIVERY TRACKER") : (language === "hi" ? "लाइव पिकअप ट्रैकिंग" : "LIVE PICKUP TRACKER")}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                <Radio size={12} className="animate-pulse" /> LIVE GPS
              </span>
            </div>
            <h3 style={{ margin: "2px 0 0", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.2px" }}>
              Job ID: <span style={{ color: "#f4c400" }}>{jobId}</span>
            </h3>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.07)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Smartphone size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "-2px" }} />
            {device}
          </div>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#fff",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* STATUS BANNER */}
      <div
        style={{
          padding: "16px 22px",
          background: "rgba(244, 196, 0, 0.08)",
          borderBottom: "1px solid rgba(244, 196, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: stage.color,
              boxShadow: `0 0 12px ${stage.color}`,
            }}
          />
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
              {stage.title}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
              {stage.desc}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 600 }}>
              {language === "hi" ? "अनुमानित दूरी" : "EST. DISTANCE"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#f4c400" }}>
              {remainingDist > 0 ? `${remainingDist} km` : "At Location"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 600 }}>
              {language === "hi" ? "अनुमानित समय" : "EST. TIME (ETA)"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#34d399" }}>
              {remainingTime > 0 ? `~${remainingTime} mins` : "Arrived"}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE MAP CANVAS / VISUALIZATION */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "300px",
          background: "#131722",
          overflow: "hidden",
        }}
      >
        {/* Map Grid and Street Pattern */}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          style={{ width: "100%", height: "100%", display: "block" }}
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4c400" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(244,196,0,0.2)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.2)" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Simulated Street Roads */}
          <path d="M 0 160 Q 150 140 300 170 T 600 150" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" strokeLinecap="round" />
          <path d="M 120 0 Q 180 150 100 300" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
          <path d="M 460 0 Q 420 150 510 300" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
          <path d="M 0 90 L 600 240" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />

          {/* Active Route Polyline */}
          <path
            d={`M ${shopX} ${shopY} Q ${(shopX + custX) / 2} ${(shopY + custY) / 2 - 50} ${custX} ${custY}`}
            fill="none"
            stroke="url(#roadGradient)"
            strokeWidth="5"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />

          {/* Ansar Telecom Shop Marker */}
          <g transform={`translate(${shopX}, ${shopY})`}>
            <circle r="24" fill="rgba(244, 196, 0, 0.15)" />
            <circle r="14" fill="#f4c400" />
            <circle r="7" fill="#000" />
            <text x="0" y="32" fill="#f4c400" fontSize="12" fontWeight="700" textAnchor="middle">
              Ansar Telecom (Workshop)
            </text>
          </g>

          {/* Customer Destination Marker */}
          <g transform={`translate(${custX}, ${custY})`}>
            <circle r="24" fill="rgba(16, 185, 129, 0.15)" />
            <circle r="14" fill="#10b981" />
            <circle r="7" fill="#fff" />
            <text x="0" y="32" fill="#34d399" fontSize="12" fontWeight="700" textAnchor="middle">
              Customer ({customerName.split(" ")[0]})
            </text>
          </g>

          {/* Live Rider Marker */}
          <g transform={`translate(${riderX}, ${riderY})`}>
            {/* Animated Pulsing Ring */}
            <circle r="28" fill="rgba(59, 130, 246, 0.25)">
              <animate attributeName="r" values="18;34;18" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="16" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
            <circle r="8" fill="#f4c400" />
            <text x="0" y="-22" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
              🛵 {riderName.split(" ")[0]}
            </text>
          </g>
        </svg>

        {/* Floating Controls / Badge Overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "14px",
            background: "rgba(15, 17, 23, 0.85)",
            backdropFilter: "blur(10px)",
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Compass size={14} color="#f4c400" />
          <span>Basti City Transit · Sector 4</span>
        </div>

        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "14px",
            background: "rgba(15, 17, 23, 0.85)",
            backdropFilter: "blur(10px)",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: "11px",
            color: "#34d399",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Radio size={12} className="animate-pulse" /> Speed: 26 km/h
        </div>
      </div>

      {/* RIDER & CUSTOMER PROFILE FOOTER */}
      <div
        style={{
          padding: "20px 22px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "18px",
          alignItems: "center",
        }}
      >
        {/* Rider Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f4c400 0%, #d97706 100%)",
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "16px",
              }}
            >
              {riderName.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#f4c400", fontWeight: 700 }}>
                {language === "hi" ? "असाइन किया गया राइडर" : "ASSIGNED RIDER"}
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
                {riderName}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                {vehicleNo}
              </div>
            </div>
          </div>

          <a
            href={`tel:${riderPhone}`}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#10b981",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
            title={language === "hi" ? "राइडर को कॉल करें" : "Call Rider"}
          >
            <Phone size={18} />
          </a>
        </div>

        {/* Customer Address Details */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "14px 16px",
          }}
        >
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
            {taskType === "delivery" ? (language === "hi" ? "डिलीवरी का पता" : "DELIVERY DESTINATION") : (language === "hi" ? "पिकअप का पता" : "PICKUP LOCATION")}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginTop: "2px" }}>
            <MapPin size={14} style={{ display: "inline", marginRight: "4px", color: "#ef4444", verticalAlign: "-2px" }} />
            {customerAddress}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
            Customer: <strong>{customerName}</strong>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div style={{ width: "100%", maxWidth: "800px" }}>{content}</div>
      </div>
    );
  }

  return content;
}
