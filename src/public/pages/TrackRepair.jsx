import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  IndianRupee,
  LockKeyhole,
  PackageCheck,
  PhoneCall,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

import {
  httpsCallable,
} from "firebase/functions";

import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { functions } from "../../firebase";
import { db } from "../../firebase/firebase";

import PublicNavbar from "../components/PublicNavbar";
import { useLanguage } from "../context/LanguageContext";

import "../styles/trackRepair.css";

/* =========================================================
   CONTACT NUMBERS FOR RECEPTION & OWNER APPROVAL
========================================================= */

const SHOP_PHONE = "9415172051";
const SHOP_PHONE_DISPLAY = "+91 94151 72051";

/* =========================================================
   CUSTOMER REPAIR LIFECYCLE
   IMPORTANT:
   These internal values remain in English because they
   can come directly from the backend / Firestore.
========================================================= */

const TRACKING_STEPS = [
  "Device Received",
  "Diagnosis",
  "Waiting Customer Approval",
  "Approved",
  "Repair In Progress",
  "Waiting Part",
  "Testing",
  "Ready",
  "Delivered",
];

/* =========================================================
   TRANSLATIONS
========================================================= */

const trackContent = {
  en: {
    stages: {
      "Device Received":
        "Device Received",
      Diagnosis:
        "Diagnosis",
      "Waiting Customer Approval":
        "Waiting Customer Approval",
      Approved:
        "Approved",
      "Repair In Progress":
        "Repair In Progress",
      "Waiting Part":
        "Waiting Part",
      Testing:
        "Testing",
      Ready:
        "Ready",
      Delivered:
        "Delivered",
    },

    errors: {
      notFound:
        "We couldn't find a repair matching that Job ID and registered mobile number.",

      invalid:
        "Please check your Job ID and mobile number.",

      attempts:
        "Too many tracking attempts. Please wait a few minutes and try again.",

      permission:
        "This repair cannot be viewed publicly.",

      unavailable:
        "Repair tracking is temporarily unavailable.",

      serviceUnavailable:
        "Tracking service is temporarily unavailable. Please try again.",

      internal:
        "We couldn't check your repair right now. Please try again.",

      timeout:
        "Tracking is taking longer than expected. Please try again.",

      generic:
        "Something went wrong while checking your repair.",

      jobRequired:
        "Enter your Repair Job ID.",

      jobInvalid:
        "Enter a valid Repair Job ID.",

      phoneInvalid:
        "Enter the valid 10-digit mobile number registered with your repair.",
    },

    hero: {
      back:
        "Back to Ansar Telecom",

      eyebrow:
        "LIVE REPAIR EXPERIENCE",

      title1:
        "Track your",

      title2:
        "repair journey.",

      description:
        "Enter the Job ID given by Ansar Telecom and the mobile number registered with your repair.",

      securityTitle:
        "Customer-safe tracking",

      securityText:
        "Only information intended for the customer is shown. Internal repair notes and staff information remain private.",
    },

    search: {
      brand:
        "ANSAR / TRACK",

      found:
        "Repair found",

      find:
        "Find your repair",

      secure:
        "SECURE",

      jobId:
        "Repair Job ID",

      jobPlaceholder:
        "Example: AT-1006 or 1006",

      phone:
        "Registered mobile number",

      checking:
        "Checking repair",

      track:
        "Track My Repair",

      completed:
        "Repair lookup completed.",

      verified:
        "VERIFIED REPAIR",

      customerDevice:
        "Customer Device",

      another:
        "Track another repair",

      footer:
        "Job ID and registered mobile number must match.",

      invalidResponse:
        "Invalid tracking response.",
    },

    preview: {
      eyebrow:
        "WHAT YOU CAN TRACK",

      title1:
        "Clear updates.",

      title2:
        "No repair-room confusion.",

      cards: [
        {
          title:
            "Repair stage",

          text:
            "See where your device currently is in the repair journey.",
        },
        {
          title:
            "Your approval",

          text:
            "Know when an estimate is waiting for your decision.",
        },
        {
          title:
            "Ready status",

          text:
            "Know when testing is complete and your device is ready.",
        },
      ],
    },

    live: {
      verified:
        "VERIFIED REPAIR",

      yourDevice:
        "Your Device",

      jobId:
        "Job ID",

      liveStatus:
        "LIVE STATUS",

      currentStage:
        "CURRENT STAGE",

      registeredMobile:
        "REGISTERED MOBILE",

      customerStatus:
        "CUSTOMER STATUS",

      defaultStage:
        "Device Received",

      defaultStatus:
        "Repair update available",

      currentStageMessage:
        "Your repair is currently at this stage.",
    },

    estimate: {
      eyebrow:
        "REPAIR ESTIMATE",

      title:
        "Estimate details",

      diagnosis:
        "Diagnosis",

      parts:
        "Parts required",

      total:
        "Estimated total",
    },

    approval: {
      eyebrow:
        "CUSTOMER APPROVAL",

      pending:
        "Pending Call",

      approved:
        "Approved",

      updated:
        "Updated",

      callToApprove:
        "Call to Approve",
    },

    approvalWindow: {
      badge: "Customer Approval Required",
      title: "Repair Estimate & Approval Details",
      subtitle:
        "Our technician has completed device diagnosis. Please review the diagnosed problem and repair cost below, then call our receptionist or shop owner to approve the repair.",
      deviceLabel: "Device Model",
      problemLabel: "Diagnosed Problem / Fault",
      notesLabel: "Technician Notes",
      partsLabel: "Parts Required",
      partsNone: "Included in service (no extra parts)",
      costLabel: "Total Repair Estimate",
      partsCostLabel: "Parts Charges",
      labourCostLabel: "Service / Labour Charges",
      advanceLabel: "Advance Paid",
      balanceLabel: "Payable on Delivery / Pickup",
      callSectionTitle: "Call Receptionist to Approve",
      callSectionDesc:
        "Call our receptionist on the number below to give your approval. When you confirm over the phone, our receptionist or owner will mark 'Customer Approved' in our system and repair will begin immediately.",
      callBtnLabel: "Call Receptionist",
      callOwnerBtnLabel: "Owner (Aqib Ansari)",
      whatsappBtnLabel: "Approve via WhatsApp",
      approvalNotice: "Once you call and approve, the status will automatically update to Approved.",
      approvedTitle: "Repair Approved by Customer",
      approvedDesc:
        "Your approval has been confirmed by our receptionist. Our technician is now actively working on your repair!",
    },

    payment: {
      eyebrow:
        "PAYMENT",

      pending:
        "Pending",

      total:
        "Total",

      paid:
        "Paid",

      balance:
        "Balance",
    },

    update: {
      lastUpdated:
        "Last updated",
    },

    help: {
      eyebrow:
        "NEED HELP?",

      title:
        "Can't find your repair?",

      description:
        "Keep your Job ID ready and contact Ansar Telecom for assistance.",

      button:
        "Contact Ansar Telecom",
    },
  },

  hi: {
    stages: {
      "Device Received":
        "डिवाइस प्राप्त हुआ",

      Diagnosis:
        "डिवाइस की जांच",

      "Waiting Customer Approval":
        "ग्राहक की मंजूरी का इंतजार",

      Approved:
        "मंजूरी मिल गई",

      "Repair In Progress":
        "रिपेयर जारी है",

      "Waiting Part":
        "पार्ट का इंतजार",

      Testing:
        "डिवाइस टेस्टिंग",

      Ready:
        "डिवाइस तैयार है",

      Delivered:
        "डिलीवर हो गया",
    },

    errors: {
      notFound:
        "इस Job ID और रजिस्टर्ड मोबाइल नंबर से कोई रिपेयर नहीं मिला।",

      invalid:
        "कृपया अपना Job ID और मोबाइल नंबर जांचें।",

      attempts:
        "बहुत अधिक tracking attempts किए गए हैं। कृपया कुछ मिनट बाद दोबारा कोशिश करें।",

      permission:
        "इस रिपेयर की जानकारी सार्वजनिक रूप से नहीं देखी जा सकती।",

      unavailable:
        "Repair tracking फिलहाल उपलब्ध नहीं है।",

      serviceUnavailable:
        "Tracking service फिलहाल उपलब्ध नहीं है। कृपया थोड़ी देर बाद दोबारा कोशिश करें।",

      internal:
        "अभी आपकी रिपेयर की जानकारी नहीं देखी जा सकी। कृपया दोबारा कोशिश करें।",

      timeout:
        "Tracking में सामान्य से अधिक समय लग रहा है। कृपया दोबारा कोशिश करें।",

      generic:
        "आपकी रिपेयर की जानकारी देखते समय कुछ समस्या हुई।",

      jobRequired:
        "अपना Repair Job ID दर्ज करें।",

      jobInvalid:
        "सही Repair Job ID दर्ज करें।",

      phoneInvalid:
        "अपनी रिपेयर के साथ रजिस्टर्ड सही 10 अंकों का मोबाइल नंबर दर्ज करें।",
    },

    hero: {
      back:
        "Ansar Telecom पर वापस जाएं",

      eyebrow:
        "लाइव रिपेयर अपडेट",

      title1:
        "अपनी रिपेयर",

      title2:
        "की स्थिति देखें।",

      description:
        "Ansar Telecom द्वारा दिया गया Job ID और अपनी रिपेयर के साथ रजिस्टर्ड मोबाइल नंबर दर्ज करें।",

      securityTitle:
        "ग्राहक के लिए सुरक्षित ट्रैकिंग",

      securityText:
        "यहां केवल वही जानकारी दिखाई जाती है जो ग्राहक के लिए है। Internal repair notes और staff की जानकारी private रहती है।",
    },

    search: {
      brand:
        "ANSAR / TRACK",

      found:
        "रिपेयर मिल गई",

      find:
        "अपनी रिपेयर खोजें",

      secure:
        "सुरक्षित",

      jobId:
        "Repair Job ID",

      jobPlaceholder:
        "उदाहरण: AT-1006 या 1006",

      phone:
        "रजिस्टर्ड मोबाइल नंबर",

      checking:
        "रिपेयर जांची जा रही है",

      track:
        "मेरी रिपेयर ट्रैक करें",

      completed:
        "रिपेयर की खोज पूरी हुई।",

      verified:
        "सत्यापित रिपेयर",

      customerDevice:
        "ग्राहक का डिवाइस",

      another:
        "दूसरी रिपेयर ट्रैक करें",

      footer:
        "Job ID और रजिस्टर्ड मोबाइल नंबर का आपस में मिलना जरूरी है।",

      invalidResponse:
        "Tracking response सही नहीं मिला।",
    },

    preview: {
      eyebrow:
        "आप क्या ट्रैक कर सकते हैं",

      title1:
        "साफ और आसान अपडेट।",

      title2:
        "रिपेयर की स्थिति को लेकर कोई उलझन नहीं।",

      cards: [
        {
          title:
            "रिपेयर स्टेज",

          text:
            "देखें कि आपका डिवाइस इस समय रिपेयर प्रक्रिया के किस चरण में है।",
        },
        {
          title:
            "आपकी मंजूरी",

          text:
            "जानें कि repair estimate कब आपके निर्णय का इंतजार कर रहा है।",
        },
        {
          title:
            "डिवाइस तैयार",

          text:
            "जानें कि testing कब पूरी हो गई है और आपका डिवाइस कब तैयार है।",
        },
      ],
    },

    live: {
      verified:
        "सत्यापित रिपेयर",

      yourDevice:
        "आपका डिवाइस",

      jobId:
        "Job ID",

      liveStatus:
        "लाइव स्थिति",

      currentStage:
        "वर्तमान स्टेज",

      registeredMobile:
        "रजिस्टर्ड मोबाइल",

      customerStatus:
        "ग्राहक स्टेटस",

      defaultStage:
        "डिवाइस प्राप्त हुआ",

      defaultStatus:
        "रिपेयर अपडेट उपलब्ध है",

      currentStageMessage:
        "आपकी रिपेयर इस समय इस चरण में है।",
    },

    estimate: {
      eyebrow:
        "रिपेयर अनुमान",

      title:
        "Estimate की जानकारी",

      diagnosis:
        "जांच",

      parts:
        "जरूरी पार्ट्स",

      total:
        "अनुमानित कुल राशि",
    },

    approval: {
      eyebrow:
        "ग्राहक की मंजूरी",

      pending:
        "कॉल की प्रतीक्षा",

      approved:
        "मंजूर किया गया",

      updated:
        "अपडेट",

      callToApprove:
        "कॉल करके अप्रूव करें",
    },

    approvalWindow: {
      badge: "ग्राहक की मंजूरी आवश्यक",
      title: "रिपेयर एस्टीमेट व स्वीकृति विवरण",
      subtitle:
        "हमारे टेक्नीशियन ने आपके डिवाइस की जांच (Diagnosis) पूरी कर ली है। कृपया नीचे समस्या और रिपेयर खर्च देखें, फिर रिसेप्शनिस्ट को कॉल करके रिपेयर की मंजूरी दें।",
      deviceLabel: "डिवाइस मॉडल",
      problemLabel: "पाई गई समस्या / खराबी",
      notesLabel: "टेक्नीशियन का विवरण",
      partsLabel: "ज़रूरी पार्ट्स",
      partsNone: "सर्विस में शामिल (अलग से पार्ट्स की जरूरत नहीं)",
      costLabel: "कुल अनुमानित रिपेयर खर्च",
      partsCostLabel: "पार्ट्स का खर्च",
      labourCostLabel: "सर्विस / लेबर चार्ज",
      advanceLabel: "जमा अग्रिम राशि",
      balanceLabel: "डिलीवरी / पिकअप पर देय राशि",
      callSectionTitle: "रिसेप्शनिस्ट को कॉल करके अप्रूव करें",
      callSectionDesc:
        "नीचे दिए गए नंबर पर कॉल करके रिपेयर की सहमति दें। आपके कॉल पर 'रिपेयर कर दीजिए' कहते ही रिसेप्शनिस्ट या ओनर सिस्टम में 'Customer Approved' मार्क कर देंगे और रिपेयर तुरंत शुरू हो जाएगी।",
      callBtnLabel: "रिसेप्शनिस्ट को कॉल करें",
      callOwnerBtnLabel: "ओनर (आकिब अंसारी)",
      whatsappBtnLabel: "व्हाट्सएप पर अप्रूव करें",
      approvalNotice: "आपके कॉल करने पर रिसेप्शनिस्ट तुरंत 'Customer Approved' कर देंगे और स्टेटस बदल जाएगा।",
      approvedTitle: "रिपेयर को ग्राहक द्वारा मंजूरी मिल चुकी है",
      approvedDesc:
        "रिसेप्शनिस्ट द्वारा आपकी सहमति दर्ज कर ली गई है। हमारे टेक्नीशियन आपके डिवाइस पर काम कर रहे हैं!",
    },

    payment: {
      eyebrow:
        "पेमेंट",

      pending:
        "बाकी है",

      total:
        "कुल राशि",

      paid:
        "जमा राशि",

      balance:
        "बाकी राशि",
    },

    update: {
      lastUpdated:
        "अंतिम अपडेट",
    },

    help: {
      eyebrow:
        "मदद चाहिए?",

      title:
        "अपनी रिपेयर नहीं मिल रही?",

      description:
        "अपना Job ID तैयार रखें और सहायता के लिए Ansar Telecom से संपर्क करें।",

      button:
        "Ansar Telecom से संपर्क करें",
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeJobId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^#+/, "")
    .replace(/\s+/g, "");
}

function extractCandidateJobIds(rawInput) {
  if (!rawInput) return [];
  const trimmed = String(rawInput).trim();
  const candidates = new Set();

  const cleaned = trimmed.replace(/\s+/g, "").toUpperCase();
  if (cleaned) candidates.add(cleaned);

  const noHash = cleaned.replace(/^#+/, "");
  if (noHash) candidates.add(noHash);

  const noJobPrefix = noHash.replace(/^JOB[-#_]?/, "");
  if (noJobPrefix) candidates.add(noJobPrefix);

  const numMatch = noHash.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    candidates.add(`AT-${num}`);
    candidates.add(`AT${num}`);
    candidates.add(num);
    const unpadded = String(parseInt(num, 10));
    if (unpadded !== num) {
      candidates.add(`AT-${unpadded}`);
      candidates.add(`AT${unpadded}`);
      candidates.add(unpadded);
    }
  }

  if (/^AT\d+$/i.test(noHash)) {
    candidates.add(`AT-${noHash.slice(2)}`);
  }

  if (/^AT-\d+$/i.test(noHash)) {
    candidates.add(`AT${noHash.slice(3)}`);
    candidates.add(noHash.slice(3));
  }

  return Array.from(candidates);
}

function extractDocPhones(docData) {
  if (!docData) return [];
  const phones = [];
  const add = (val) => {
    if (!val) return;
    const clean = normalizeIndianPhone(String(val));
    if (clean && !phones.includes(clean)) {
      phones.push(clean);
    }
  };

  add(docData.phone);
  add(docData.mobileNumber);
  add(docData.customerPhone);
  add(docData.mobile);
  add(docData.phoneNumber);
  add(docData.contactNumber);
  add(docData.customerContact);
  add(docData.phoneNo);
  add(docData.customerMobile);
  if (docData.customer && typeof docData.customer === "object") {
    add(docData.customer.phone);
    add(docData.customer.mobile);
  }
  if (docData.pickupAddress && typeof docData.pickupAddress === "object") {
    add(docData.pickupAddress.phone);
  }
  return phones;
}

function isPhoneMatch(docData, cleanPhone) {
  if (!cleanPhone) return false;
  const phones = extractDocPhones(docData);
  if (phones.length === 0) {
    return true;
  }
  if (phones.includes(cleanPhone)) return true;
  for (const p of phones) {
    if (p.endsWith(cleanPhone) || cleanPhone.endsWith(p)) return true;
    if (cleanPhone.length >= 5 && p.slice(-5) === cleanPhone.slice(-5)) return true;
  }
  const last3 = docData.registeredPhoneLast3 || (phones[0] ? phones[0].slice(-3) : "");
  if (last3 && last3.length >= 3 && cleanPhone.endsWith(last3)) return true;
  return false;
}

function normalizeIndianPhone(value) {
  let digits = String(value || "")
    .replace(/\D/g, "");

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    digits = digits.slice(2);
  }

  if (
    digits.length === 11 &&
    digits.startsWith("0")
  ) {
    digits = digits.slice(1);
  }

  return digits;
}

function formatPhoneInput(value) {
  let digits = String(value || "")
    .replace(/\D/g, "");

  if (
    digits.length > 10 &&
    digits.startsWith("91")
  ) {
    digits = digits.slice(2);
  }

  if (
    digits.length > 10 &&
    digits.startsWith("0")
  ) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(
    0,
    5
  )} ${digits.slice(5)}`;
}

function maskPhoneLast3(last3) {
  const digits = String(last3 || "")
    .replace(/\D/g, "")
    .slice(-3);

  if (digits.length !== 3) {
    return "+91 ••••• •••••";
  }

  return `+91 ••••• ••${digits}`;
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

function formatDate(
  value,
  language = "en"
) {
  if (!value) {
    return "";
  }

  let date;

  /*
    Supports:
    - ISO string
    - milliseconds
    - Firestore Timestamp-like objects
  */

  if (
    typeof value === "object" &&
    typeof value.toDate === "function"
  ) {
    date = value.toDate();
  } else if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    date = new Date(
      value.seconds * 1000
    );
  } else {
    date = new Date(value);
  }

  if (
    !date ||
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    language === "hi"
      ? "hi-IN"
      : "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

/* =========================================================
   REPAIR DATA NORMALIZATION
========================================================= */

function normalizeRepairDoc(cleanJobId, docData, last3, firestoreId, collectionName = "repairJobs") {
  if (!docData) return null;

  const problem =
    docData.problem ||
    docData.issue ||
    docData.reportedProblem ||
    docData.diagnosisSummary ||
    docData["diagnosis.summary"] ||
    docData.diagnosis?.summary ||
    docData["diagnosis.faultSummary"] ||
    docData.diagnosis?.faultSummary ||
    docData.diagnosisDetails ||
    docData.diagnosisDescription ||
    docData.faultSummary ||
    "";

  const diagnosisNotes =
    docData["diagnosis.technicianNotes"] ||
    docData.diagnosis?.technicianNotes ||
    docData["diagnosis.description"] ||
    docData.diagnosis?.description ||
    docData.diagnosisDetails ||
    docData.notes ||
    "";

  const partsRequired =
    docData.partsRequired ||
    docData.requiredParts ||
    docData["diagnosis.requiredParts"] ||
    docData.diagnosis?.requiredParts ||
    docData["estimate.partsRequired"] ||
    docData.estimate?.partsRequired ||
    docData.partRequirement?.name ||
    "";

  const totalAmount = Number(
    docData["estimate.totalAmount"] ||
    docData.estimate?.totalAmount ||
    docData["estimate.total"] ||
    docData.estimate?.total ||
    docData.estimatedCost ||
    docData.estimatedCharge ||
    docData.amount ||
    docData.totalAmount ||
    0
  );

  const partsAmount = Number(
    docData["estimate.partsAmount"] ||
    docData.estimate?.partsAmount ||
    0
  );

  const labourAmount = Number(
    docData["estimate.labourAmount"] ||
    docData.estimate?.labourAmount ||
    0
  );

  const paidAmount = Number(
    docData.receivedAmount ||
    docData.paidAmount ||
    docData.advance ||
    docData.payment?.paidAmount ||
    0
  );

  const balanceAmount = Math.max(0, totalAmount - paidAmount);

  const rawApprovalStatus =
    docData["customerApproval.status"] ||
    docData.customerApproval?.status ||
    docData.approvalStatus;

  const repairStage =
    docData.repairStage ||
    docData.status ||
    "Device Received";

  const approvalStatus =
    rawApprovalStatus ||
    (repairStage === "Waiting Customer Approval" ? "Pending" : null);

  const approvedAt =
    docData["customerApproval.approvedAt"] ||
    docData.customerApproval?.approvedAt ||
    docData.approvalConfirmedAt ||
    null;

  const rejectedAt =
    docData["customerApproval.rejectedAt"] ||
    docData.customerApproval?.rejectedAt ||
    null;

  return {
    ...docData,
    firestoreId: firestoreId || docData.id || cleanJobId,
    collectionName: collectionName || "repairJobs",
    jobId: docData.id || docData.jobId || cleanJobId,
    device: docData.device || `${docData.brand || ""} ${docData.model || ""}`.trim() || "Customer Device",
    brand: docData.brand || "",
    model: docData.model || "",
    repairStage,
    customerStatus: docData.customerStatus || "Your repair is currently in progress at Ansar Telecom.",
    customerStatusCode: docData.customerStatusCode || "IN_PROGRESS",
    registeredPhoneLast3: last3,
    isPickDrop: Boolean(docData.isPickDrop || docData.source === "pick_and_drop" || docData.riderStatus),
    riderStatus: docData.riderStatus || null,
    assignedRiderName: docData.assignedRiderName || null,
    createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate().toISOString() : (docData.createdAt || new Date().toISOString()),
    updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate().toISOString() : (docData.updatedAt || null),

    problem: problem || "Comprehensive diagnosis & device service",
    diagnosisNotes,
    partsRequired,
    estimatedCost: totalAmount,
    partsAmount,
    labourAmount,
    receivedAmount: paidAmount,
    balanceAmount,

    estimate: {
      diagnosisSummary: problem || "Complete device diagnosis",
      partsRequired: partsRequired || "",
      total: totalAmount,
      partsAmount,
      labourAmount,
      preparedBy: docData["estimate.preparedBy"] || docData.estimate?.preparedBy || docData.technicianName || "",
    },

    customerApproval: {
      status: approvalStatus || "Pending",
      approvedAt,
      rejectedAt,
    },

    payment: docData.payment || {
      status: (paidAmount >= totalAmount && totalAmount > 0) ? "Paid" : (paidAmount > 0 ? "Partial" : "Pending"),
      totalAmount,
      paidAmount,
      balance: balanceAmount,
    },
  };
}

/* =========================================================
   STAGE NORMALIZATION
========================================================= */

function getStageIndex(stage) {
  const currentStage = String(
    stage || ""
  )
    .trim()
    .toLowerCase();

  const index =
    TRACKING_STEPS.findIndex(
      (item) =>
        item.toLowerCase() ===
        currentStage
    );

  if (index >= 0) {
    return index;
  }

  /*
    Internal shop states that should not
    expose unnecessary operational detail.
  */

  if (
    currentStage ===
      "returned to reception" ||
    currentStage ===
      "returned without repair"
  ) {
    return 7;
  }

  return 0;
}

function getLocalizedStage(
  stage,
  text
) {
  if (!stage) {
    return text.live.defaultStage;
  }

  const matchedStage =
    TRACKING_STEPS.find(
      (item) =>
        item.toLowerCase() ===
        String(stage)
          .trim()
          .toLowerCase()
    );

  if (matchedStage) {
    return (
      text.stages[matchedStage] ||
      matchedStage
    );
  }

  const normalized = String(stage)
    .trim()
    .toLowerCase();

  if (
    normalized ===
      "returned to reception" ||
    normalized ===
      "returned without repair"
  ) {
    return text.stages.Ready;
  }

  /*
    Unknown backend stage is preserved
    rather than incorrectly translating it.
  */

  return stage;
}

function getLocalizedStatus(
  value,
  language,
  fallback
) {
  if (!value) {
    return fallback;
  }

  if (language !== "hi") {
    return value;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  const statusMap = {
    pending: "बाकी है",
    approved: "मंजूर किया गया",
    rejected: "अस्वीकृत",
    paid: "भुगतान हो गया",
    unpaid: "भुगतान बाकी है",
    partial: "आंशिक भुगतान",
    completed: "पूरा हुआ",
    ready: "तैयार है",
    delivered: "डिलीवर हो गया",
  };

  return (
    statusMap[normalized] ||
    value
  );
}

/* =========================================================
   FIREBASE ERROR HANDLING
========================================================= */

function getFirebaseErrorMessage(
  error,
  text
) {
  if (error?.message && !error?.code && !error.message.startsWith("FirebaseError")) {
    return error.message;
  }

  const code = String(
    error?.code || ""
  ).toLowerCase();

  if (
    code.includes("not-found")
  ) {
    return text.errors.notFound;
  }

  if (
    code.includes(
      "invalid-argument"
    )
  ) {
    /*
      We intentionally use our own
      localized customer-safe message.
    */

    return text.errors.invalid;
  }

  if (
    code.includes(
      "resource-exhausted"
    )
  ) {
    return text.errors.attempts;
  }

  if (
    code.includes(
      "permission-denied"
    )
  ) {
    return text.errors.permission;
  }

  if (
    code.includes(
      "failed-precondition"
    )
  ) {
    return text.errors.unavailable;
  }

  if (
    code.includes("unavailable")
  ) {
    return text.errors.serviceUnavailable;
  }

  if (
    code.includes("internal")
  ) {
    return text.errors.internal;
  }

  if (
    code.includes(
      "deadline-exceeded"
    )
  ) {
    return text.errors.timeout;
  }

  return text.errors.generic;
}

/* =========================================================
   COMPONENT
========================================================= */

function TrackRepair() {
  const { language } =
    useLanguage();
  const [searchParams] = useSearchParams();

  const text =
    trackContent[language] ||
    trackContent.en;

  const [jobId, setJobId] =
    useState(() => (searchParams.get("jobId") || "").toUpperCase());

  const [phone, setPhone] =
    useState(() => formatPhoneInput(searchParams.get("phone") || ""));

  const [customerRepairsList, setCustomerRepairsList] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [error, setError] =
    useState("");

  const [repair, setRepair] =
    useState(null);

  /* =======================================================
     NORMALIZED PHONE
  ======================================================= */

  const normalizedPhone =
    useMemo(
      () =>
        normalizeIndianPhone(
          phone
        ),
      [phone]
    );

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validate = (targetJobId = jobId, targetPhone = normalizedPhone) => {
    const cleanPhone =
      normalizeIndianPhone(targetPhone);

    if (
      cleanPhone.length !==
        10 ||
      !/^[6-9]\d{9}$/.test(
        cleanPhone
      )
    ) {
      return text.errors.phoneInvalid;
    }

    const cleanJobId =
      normalizeJobId(targetJobId);

    if (!cleanJobId) {
      return text.errors.jobRequired;
    }

    if (
      !/^[A-Z0-9-]{1,30}$/.test(
        cleanJobId
      )
    ) {
      return text.errors.jobInvalid;
    }

    return "";
  };

  /* =======================================================
     LOOKUP LOGIC (Cloud Function + Direct Multi-Strategy Firestore)
  ======================================================= */

  const executeLookup = async (targetJobId, targetPhone) => {
    const rawJobId = String(targetJobId || "").trim();
    const cleanJobId = normalizeJobId(rawJobId);
    const cleanPhone = normalizeIndianPhone(targetPhone);
    const candidates = extractCandidateJobIds(rawJobId);

    const validationError = validate(cleanJobId, cleanPhone);
    if (validationError) {
      setError(validationError);
      setRepair(null);
      setSearched(false);
      setCustomerRepairsList([]);
      return;
    }

    setLoading(true);
    setError("");
    setRepair(null);
    setSearched(false);
    setCustomerRepairsList([]);

    try {
      let repairData = null;

      // 1. Try Cloud Function first if candidate is available
      if (candidates.length > 0) {
        try {
          const trackRepair = httpsCallable(functions, "trackRepair");
          const result = await trackRepair({
            jobId: candidates[0],
            phone: cleanPhone,
          });

          if (result?.data?.success && result?.data?.repair) {
            repairData = normalizeRepairDoc(
              result.data.repair.jobId || candidates[0],
              result.data.repair,
              result.data.repair.registeredPhoneLast3 || cleanPhone.slice(-3),
              result.data.repair.id || candidates[0],
              "repairJobs"
            );
          }
        } catch (cfErr) {
          console.warn("Cloud function tracking attempt:", cfErr?.message || cfErr);
        }
      }

      // 2. Direct Firestore fallback
      if (!repairData) {
        let matchedDoc = null;
        let matchedCollection = "repairJobs";

        // 2a. Direct getDoc in repairJobs
        if (candidates.length > 0) {
          const docPromises = candidates.map((cand) => getDoc(doc(db, "repairJobs", cand)));
          const snaps = await Promise.all(docPromises);
          const foundIndex = snaps.findIndex((s) => s.exists());
          if (foundIndex !== -1) {
            matchedDoc = snaps[foundIndex];
            matchedCollection = "repairJobs";
          }
        }

        // 2b. Direct getDoc in pickupRequests
        if (!matchedDoc && candidates.length > 0) {
          const pickupPromises = candidates.map((cand) => getDoc(doc(db, "pickupRequests", cand)));
          const pickupSnaps = await Promise.all(pickupPromises);
          const foundPickupIndex = pickupSnaps.findIndex((s) => s.exists());
          if (foundPickupIndex !== -1) {
            matchedDoc = pickupSnaps[foundPickupIndex];
            matchedCollection = "pickupRequests";
          }
        }

        // 2c. Query collection repairJobs by 'id' field
        if (!matchedDoc && candidates.length > 0) {
          const candSlice = candidates.slice(0, 10);
          try {
            const idQuery = query(collection(db, "repairJobs"), where("id", "in", candSlice));
            const idSnap = await getDocs(idQuery);
            if (!idSnap.empty) {
              matchedDoc = idSnap.docs[0];
              matchedCollection = "repairJobs";
            }
          } catch {
            // Ignore query error
          }
        }

        // 2d. Query collection repairJobs by 'jobId' field
        if (!matchedDoc && candidates.length > 0) {
          const candSlice = candidates.slice(0, 10);
          try {
            const jobIdQuery = query(collection(db, "repairJobs"), where("jobId", "in", candSlice));
            const jobIdSnap = await getDocs(jobIdQuery);
            if (!jobIdSnap.empty) {
              matchedDoc = jobIdSnap.docs[0];
              matchedCollection = "repairJobs";
            }
          } catch {
            // Ignore query error
          }
        }

        // If matched by Job ID candidate:
        if (matchedDoc) {
          const docData = matchedDoc.data();
          if (isPhoneMatch(docData, cleanPhone)) {
            const phones = extractDocPhones(docData);
            const last3 = docData.registeredPhoneLast3 || (phones[0] ? phones[0].slice(-3) : cleanPhone.slice(-3));
            const canonicalJobId = docData.id || docData.jobId || matchedDoc.id;
            repairData = normalizeRepairDoc(canonicalJobId, docData, last3, matchedDoc.id, matchedCollection);
          } else {
            const phones = extractDocPhones(docData);
            const last3 = docData.registeredPhoneLast3 || (phones[0] ? phones[0].slice(-3) : "");
            const mask = last3 ? `•••${last3}` : "registered phone";
            const mismatchError = language === "hi"
              ? `Job ID ${matchedDoc.id} मिल गया, लेकिन आपका दर्ज मोबाइल नंबर मेल नहीं खाता। (रजिस्टर्ड नंबर ${mask} पर समाप्त होता है)`
              : `Job ID ${matchedDoc.id} was found, but the entered mobile number does not match. (Registered phone ends with ${mask})`;
            throw new Error(mismatchError);
          }
        } else {
          // Document was NOT found by Job ID candidate.
          // Search if this customer has repairs registered under their mobile number!
          const phoneQueries = [
            query(collection(db, "repairJobs"), where("phone", "==", cleanPhone)),
            query(collection(db, "repairJobs"), where("mobileNumber", "==", cleanPhone)),
            query(collection(db, "repairJobs"), where("customerPhone", "==", cleanPhone)),
          ];
          const results = await Promise.all(phoneQueries.map((q) => getDocs(q).catch(() => ({ docs: [] }))));
          const phoneDocsMap = new Map();
          results.forEach((snap) => {
            (snap.docs || []).forEach((d) => {
              phoneDocsMap.set(d.id, { firestoreId: d.id, ...d.data() });
            });
          });
          const customerJobs = Array.from(phoneDocsMap.values());

          if (customerJobs.length > 0) {
            // Check if numeric part of input matches any job
            const numericInput = rawJobId.replace(/\D/g, "");
            let numberMatch = null;
            if (numericInput) {
              numberMatch = customerJobs.find((j) => {
                const jNum = String(j.id || j.jobId || j.firestoreId || "").replace(/\D/g, "");
                return jNum === numericInput || jNum.endsWith(numericInput);
              });
            }

            if (numberMatch) {
              const phones = extractDocPhones(numberMatch);
              const last3 = numberMatch.registeredPhoneLast3 || (phones[0] ? phones[0].slice(-3) : cleanPhone.slice(-3));
              const canonicalJobId = numberMatch.id || numberMatch.jobId || numberMatch.firestoreId;
              repairData = normalizeRepairDoc(canonicalJobId, numberMatch, last3, numberMatch.firestoreId, "repairJobs");
            } else {
              setCustomerRepairsList(customerJobs);
              setSearched(true);
              setRepair(null);
              setError(
                language === "hi"
                  ? `Job ID '${rawJobId}' नहीं मिला, लेकिन आपके मोबाइल नंबर (+91 ${cleanPhone}) पर ${customerJobs.length} रिपेयर मिली हैं। कृपया नीचे अपनी रिपेयर चुनें:`
                  : `We couldn't find Job ID '${rawJobId}', but we found ${customerJobs.length} repair(s) registered under your mobile number (+91 ${cleanPhone}). Select your repair below:`
              );
              return;
            }
          } else {
            const notFoundMsg = language === "hi"
              ? `Job ID '${rawJobId || "दर्ज आईडी"}' और मोबाइल नंबर (+91 ${cleanPhone}) से कोई रिपेयर नहीं मिली। कृपया अपनी रसीद या SMS पर सही Job ID जांचें (जैसे AT-1006)।`
              : `We couldn't find a repair matching Job ID '${rawJobId || "entered ID"}' and registered mobile (+91 ${cleanPhone}). Please check your receipt or SMS for your Job ID (e.g. AT-1006).`;
            throw new Error(notFoundMsg);
          }
        }
      }

      if (repairData) {
        setRepair(repairData);
        setSearched(true);
        setError("");
        setCustomerRepairsList([]);
      } else {
        throw new Error(text.errors.notFound);
      }
    } catch (requestError) {
      console.error("Track repair error:", requestError);
      setRepair(null);
      setSearched(true);
      setError(
        requestError.message === text.errors.notFound
          ? text.errors.notFound
          : getFirebaseErrorMessage(requestError, text)
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     AUTO LOOKUP FROM URL PARAMS
  ======================================================= */

  useEffect(() => {
    const urlJobId = searchParams.get("jobId");
    const urlPhone = searchParams.get("phone");
    if (urlJobId && urlPhone) {
      const timer = setTimeout(() => {
        executeLookup(urlJobId.toUpperCase(), normalizeIndianPhone(urlPhone));
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     REALTIME LISTENER ON ACTIVE REPAIR
  ======================================================= */

  useEffect(() => {
    if (!repair?.jobId) return;

    const docTargetId = repair.firestoreId || repair.jobId;
    const targetCollection = repair.collectionName || "repairJobs";

    const unsub = onSnapshot(
      doc(db, targetCollection, docTargetId),
      (snap) => {
        if (snap.exists()) {
          const liveData = snap.data();
          const phones = extractDocPhones(liveData);
          const last3 = liveData.registeredPhoneLast3 || (phones[0] ? phones[0].slice(-3) : repair.registeredPhoneLast3);
          const normalized = normalizeRepairDoc(repair.jobId, liveData, last3, snap.id, targetCollection);
          setRepair((prev) => ({
            ...prev,
            ...normalized,
          }));
        }
      },
      (err) => console.error("Realtime track sync error:", err)
    );

    return () => unsub();
  }, [repair?.jobId, repair?.firestoreId, repair?.collectionName, repair?.registeredPhoneLast3]);

  /* =======================================================
     SECURE TRACKING REQUEST
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    executeLookup(jobId, normalizedPhone);
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset = () => {
    setRepair(null);
    setError("");
    setSearched(false);
    setJobId("");
    setPhone("");
    setCustomerRepairsList([]);
  };

  /* =======================================================
     CURRENT STAGE
  ======================================================= */

  /* =======================================================
     OPTIONAL CUSTOMER DATA & APPROVAL STATE
  ======================================================= */

  const estimate =
    repair?.estimate || null;

  const customerApproval =
    repair?.customerApproval ||
    null;

  const payment =
    repair?.payment || null;

  const rawStageIndex =
    repair
      ? getStageIndex(
          repair.repairStage
        )
      : 0;

  const isWaitingApproval = Boolean(
    repair && (
      repair.repairStage === "Waiting Customer Approval" ||
      repair.customerStatusCode === "WAITING_CUSTOMER_APPROVAL" ||
      (customerApproval && customerApproval.status === "Pending") ||
      (rawStageIndex === 2 && (!customerApproval || customerApproval.status !== "Approved"))
    )
  );

  const activeStageIndex = isWaitingApproval ? 2 : rawStageIndex;

  const isApproved = Boolean(
    repair && !isWaitingApproval && (
      (customerApproval && customerApproval.status === "Approved") ||
      repair.repairStage === "Approved" ||
      activeStageIndex >= 3
    )
  );

  return (
    <div className="at-track-page">
      <PublicNavbar />

      <main>
        {/* =================================================
            HERO
        ================================================= */}

        <section className="at-track-hero">
          <div className="at-track-hero__grid" />

          <div className="at-track-hero__glow at-track-hero__glow--one" />

          <div className="at-track-hero__glow at-track-hero__glow--two" />

          <div className="at-track-page-shell">
            <Link
              to="/"
              className="at-track-back"
            >
              <ArrowLeft
                size={15}
              />

              {text.hero.back}
            </Link>

            <div className="at-track-hero__layout">
              {/* HERO COPY */}

              <div className="at-track-hero__copy">
                <div className="at-track-eyebrow">
                  <span />

                  {text.hero.eyebrow}
                </div>

                <h1>
                  {text.hero.title1}
                  <br />

                  <span>
                    {text.hero.title2}
                  </span>
                </h1>

                <p>
                  {text.hero.description}
                </p>

                <div className="at-track-security">
                  <ShieldCheck
                    size={18}
                  />

                  <div>
                    <strong>
                      {
                        text.hero
                          .securityTitle
                      }
                    </strong>

                    <span>
                      {
                        text.hero
                          .securityText
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* SEARCH CARD */}

              <div className="at-track-search-card">
                <div className="at-track-search-card__top">
                  <div>
                    <span>
                      {text.search.brand}
                    </span>

                    <strong>
                      {repair
                        ? text.search
                            .found
                        : text.search
                            .find}
                    </strong>
                  </div>

                  <div className="at-track-secure-badge">
                    <LockKeyhole
                      size={13}
                    />

                    {text.search.secure}
                  </div>
                </div>

                {!repair ? (
                  <>
                    <form
                      onSubmit={
                        handleSubmit
                      }
                    >
                      {/* JOB ID */}

                      <label>
                        <span>
                          {
                            text.search
                              .jobId
                          }
                        </span>

                        <div className="at-track-field">
                          <Wrench
                            size={17}
                          />

                          <input
                            value={
                              jobId
                            }
                            onChange={(
                              event
                            ) => {
                              setJobId(
                                event.target.value.toUpperCase()
                              );

                              if (
                                error
                              ) {
                                setError(
                                  ""
                                );
                              }
                            }}
                            placeholder={
                              text.search
                                .jobPlaceholder
                            }
                            autoComplete="off"
                            spellCheck={
                              false
                            }
                            maxLength={
                              30
                            }
                            disabled={
                              loading
                            }
                          />
                        </div>
                      </label>

                      {/* PHONE */}

                      <label>
                        <span>
                          {
                            text.search
                              .phone
                          }
                        </span>

                        <div className="at-track-field">
                          <Smartphone
                            size={17}
                          />

                          <div className="at-track-field__prefix">
                            +91
                          </div>

                          <input
                            value={
                              phone
                            }
                            onChange={(
                              event
                            ) => {
                              setPhone(
                                formatPhoneInput(
                                  event
                                    .target
                                    .value
                                )
                              );

                              if (
                                error
                              ) {
                                setError(
                                  ""
                                );
                              }
                            }}
                            placeholder="98765 43210"
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={
                              11
                            }
                            disabled={
                              loading
                            }
                          />
                        </div>
                      </label>

                      {/* SUBMIT */}

                      <button
                        type="submit"
                        className="at-track-submit"
                        disabled={
                          loading
                        }
                      >
                        {loading ? (
                          <>
                            <span className="at-track-loader" />

                            {
                              text.search
                                .checking
                            }
                          </>
                        ) : (
                          <>
                            <Search
                              size={
                                17
                              }
                            />

                            {
                              text.search
                                .track
                            }

                            <ArrowRight
                              size={
                                16
                              }
                            />
                          </>
                        )}
                      </button>
                    </form>

                    {/* ERROR */}

                    {error && (
                      <div className="at-track-message at-track-message--error">
                        <ShieldCheck
                          size={16}
                        />

                        <span>
                          {error}
                        </span>
                      </div>
                    )}

                    {/* MATCHED REPAIRS LIST FOR REGISTERED MOBILE */}
                    {customerRepairsList.length > 0 && (
                      <div className="at-track-found-list">
                        <div className="at-track-found-list__title">
                          {language === "hi"
                            ? "रजिस्टर्ड मोबाइल से मिली रिपेयर (ट्रैक करने के लिए चुनें):"
                            : "Registered repairs found (Click to track):"}
                        </div>
                        <div className="at-track-found-list__items">
                          {customerRepairsList.map((item) => {
                            const itemJobId = item.id || item.jobId || item.firestoreId;
                            const itemDevice = item.device || `${item.brand || ""} ${item.model || ""}`.trim() || "Customer Device";
                            const itemStage = item.repairStage || item.status || "Device Received";
                            return (
                              <button
                                key={itemJobId}
                                type="button"
                                className="at-track-found-card"
                                onClick={() => {
                                  setJobId(itemJobId);
                                  const itemPhone = item.phone || item.mobileNumber || item.customerPhone || phone;
                                  setPhone(formatPhoneInput(itemPhone));
                                  executeLookup(itemJobId, normalizeIndianPhone(itemPhone));
                                }}
                              >
                                <div className="at-track-found-card__info">
                                  <strong className="at-track-found-card__id">{itemJobId}</strong>
                                  <span className="at-track-found-card__device">{itemDevice}</span>
                                </div>
                                <div className="at-track-found-card__status">
                                  <span className="at-track-found-card__badge">{itemStage}</span>
                                  <ArrowRight size={14} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {searched &&
                      !error && (
                        <div className="at-track-message">
                          {
                            text.search
                              .completed
                          }
                        </div>
                      )}
                  </>
                ) : (
                  /* VERIFIED REPAIR */

                  <div className="at-track-found">
                    <div className="at-track-found__icon">
                      <CheckCircle2
                        size={25}
                      />
                    </div>

                    <span>
                      {
                        text.search
                          .verified
                      }
                    </span>

                    <strong>
                      {repair.jobId}
                    </strong>

                    <p>
                      {repair.device ||
                        text.search
                          .customerDevice}
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleReset
                      }
                    >
                      {
                        text.search
                          .another
                      }
                    </button>
                  </div>
                )}

                <div className="at-track-search-card__footer">
                  <LockKeyhole
                    size={12}
                  />

                  <span>
                    {text.search.footer}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            PREVIEW
        ================================================= */}

        {!repair && (
          <section className="at-track-preview">
            <div className="at-track-page-shell">
              <div className="at-track-preview__heading">
                <span>
                  {text.preview.eyebrow}
                </span>

                <h2>
                  {text.preview.title1}
                  <br />

                  <em>
                    {text.preview.title2}
                  </em>
                </h2>
              </div>

              <div className="at-track-preview__cards">
                <article>
                  <div>
                    <Clock3
                      size={20}
                    />
                  </div>

                  <span>
                    01
                  </span>

                  <h3>
                    {
                      text.preview
                        .cards[0].title
                    }
                  </h3>

                  <p>
                    {
                      text.preview
                        .cards[0].text
                    }
                  </p>
                </article>

                <article>
                  <div>
                    <CheckCircle2
                      size={20}
                    />
                  </div>

                  <span>
                    02
                  </span>

                  <h3>
                    {
                      text.preview
                        .cards[1].title
                    }
                  </h3>

                  <p>
                    {
                      text.preview
                        .cards[1].text
                    }
                  </p>
                </article>

                <article>
                  <div>
                    <PackageCheck
                      size={20}
                    />
                  </div>

                  <span>
                    03
                  </span>

                  <h3>
                    {
                      text.preview
                        .cards[2].title
                    }
                  </h3>

                  <p>
                    {
                      text.preview
                        .cards[2].text
                    }
                  </p>
                </article>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            LIVE REPAIR
        ================================================= */}

        {repair && (
          <section className="at-live-repair">
            <div className="at-track-page-shell">
              {/* HEADER */}

              <div className="at-live-repair__header">
                <div>
                  <div className="at-track-eyebrow">
                    <span />

                    {text.live.verified}
                  </div>

                  <h2>
                    {repair.device ||
                      text.live
                        .yourDevice}
                  </h2>

                  <p>
                    {text.live.jobId}:{" "}

                    <strong>
                      {repair.jobId}
                    </strong>
                  </p>
                </div>

                <div className="at-live-repair__status">
                  <span />

                  {text.live.liveStatus}
                </div>
              </div>

              {/* OVERVIEW */}

              <div className="at-live-repair__overview">
                <article>
                  <span>
                    {
                      text.live
                        .currentStage
                    }
                  </span>

                  <strong>
                    {getLocalizedStage(
                      repair.repairStage,
                      text
                    )}
                  </strong>
                </article>

                <article>
                  <span>
                    {
                      text.live
                        .registeredMobile
                    }
                  </span>

                  <strong>
                    {maskPhoneLast3(
                      repair.registeredPhoneLast3
                    )}
                  </strong>
                </article>

                <article>
                  <span>
                    {
                      text.live
                        .customerStatus
                    }
                  </span>

                  <strong>
                    {getLocalizedStatus(
                      repair.customerStatus,
                      language,
                      text.live
                        .defaultStatus
                    )}
                  </strong>
                </article>
              </div>

              {/* CONTENT */}

              <div className="at-track-live-grid">
                {/* TIMELINE */}

                <div className="at-track-live-main">
                  <div className="at-live-timeline">
                    {TRACKING_STEPS.map(
                      (
                        stage,
                        index
                      ) => {
                        const completed =
                          index <
                          activeStageIndex;

                        const active =
                          index ===
                          activeStageIndex;

                        return (
                          <div
                            className={`at-live-timeline__item ${
                              completed
                                ? "at-live-timeline__item--complete"
                                : ""
                            } ${
                              active
                                ? "at-live-timeline__item--active"
                                : ""
                            }`}
                            key={
                              stage
                            }
                          >
                            <div className="at-live-timeline__rail">
                              <span>
                                {completed ? (
                                  <Check
                                    size={
                                      13
                                    }
                                  />
                                ) : (
                                  String(
                                    index +
                                      1
                                  ).padStart(
                                    2,
                                    "0"
                                  )
                                )}
                              </span>

                              {index <
                                TRACKING_STEPS.length -
                                  1 && (
                                <i />
                              )}
                            </div>

                            <div>
                              <h3>
                                {
                                  text
                                    .stages[
                                    stage
                                  ]
                                }
                              </h3>

                              {active && (
                                <p>
                                  {repair.customerStatus
                                    ? getLocalizedStatus(
                                        repair.customerStatus,
                                        language,
                                        text
                                          .live
                                          .currentStageMessage
                                      )
                                    : text
                                        .live
                                        .currentStageMessage}
                                </p>
                              )}

                              {/* INLINE CUSTOMER APPROVAL DETAILS: PROBLEM, COST & CALL RECEPTIONIST */}
                              {isWaitingApproval && stage === "Waiting Customer Approval" && (
                                <div className="at-track-step-approval" id="step-customer-approval">
                                  <div className="at-track-step-approval__grid">
                                    <div className="at-track-step-approval__item">
                                      <span className="at-track-step-approval__label">
                                        {language === "hi" ? "समस्या (Problem)" : "Problem"}
                                      </span>
                                      <strong className="at-track-step-approval__value">
                                        {repair.problem || (language === "hi" ? "डायग्नोसिस पूर्ण" : "Diagnosis complete")}
                                      </strong>
                                    </div>

                                    <div className="at-track-step-approval__item">
                                      <span className="at-track-step-approval__label">
                                        {language === "hi" ? "अनुमानित खर्च (Cost)" : "Cost"}
                                      </span>
                                      <strong className="at-track-step-approval__value at-track-step-approval__value--cost">
                                        {formatMoney(repair.estimatedCost || repair.estimate?.total || 0)}
                                      </strong>
                                    </div>
                                  </div>

                                  <a
                                    href={`tel:${SHOP_PHONE}`}
                                    className="at-track-step-approval__btn"
                                    id="btn-call-receptionist-inline"
                                  >
                                    <PhoneCall size={16} />
                                    <span>
                                      {language === "hi"
                                        ? `मंजूरी देने के लिए कॉल करें: ${SHOP_PHONE_DISPLAY}`
                                        : `Call Receptionist to Approve: ${SHOP_PHONE_DISPLAY}`}
                                    </span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* SIDE INFORMATION */}

                <aside className="at-track-live-side">
                  {/* ESTIMATE */}

                  {(estimate || repair.estimatedCost > 0) && (
                    <div className="at-track-info-card" id="sidebar-repair-estimate">
                      <div className="at-track-info-card__heading">
                        <Wrench
                          size={17}
                        />

                        <div>
                          <span>
                            {
                              text
                                .estimate
                                .eyebrow
                            }
                          </span>

                          <strong>
                            {
                              text
                                .estimate
                                .title
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="at-track-info-row at-track-info-row--stack">
                        <span>
                          {
                            text
                              .estimate
                              .diagnosis
                          }
                        </span>

                        <strong>
                          {
                            repair.problem ||
                            estimate?.diagnosisSummary ||
                            "Complete device diagnosis"
                          }
                        </strong>
                      </div>

                      <div className="at-track-info-row at-track-info-row--stack">
                        <span>
                          {
                            text
                              .estimate
                              .parts
                          }
                        </span>

                        <strong>
                          {
                            repair.partsRequired ||
                            estimate?.partsRequired ||
                            (language === "hi" ? "सर्विस में शामिल" : "Included in service")
                          }
                        </strong>
                      </div>

                      <div className="at-track-info-row">
                        <span>
                          {
                            text
                              .estimate
                              .total
                          }
                        </span>

                        <strong style={{ color: "var(--track-yellow)", fontSize: "16px" }}>
                          {formatMoney(
                            repair.estimatedCost ||
                            estimate?.total ||
                            0
                          )}
                        </strong>
                      </div>

                      {Number(repair.receivedAmount) > 0 && (
                        <div className="at-track-info-row">
                          <span>
                            {text.approvalWindow.advanceLabel}
                          </span>

                          <strong>
                            {formatMoney(
                              repair.receivedAmount
                            )}
                          </strong>
                        </div>
                      )}

                      <div className="at-track-info-row">
                        <span>
                          {text.approvalWindow.balanceLabel}
                        </span>

                        <strong style={{ color: "#fca5a5" }}>
                          {formatMoney(
                            repair.balanceAmount ||
                            repair.estimatedCost ||
                            0
                          )}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* CUSTOMER APPROVAL */}

                  <div className="at-track-info-card" id="sidebar-customer-approval">
                    <div className="at-track-info-card__heading">
                      {isApproved ? (
                        <CheckCircle2
                          size={17}
                          style={{ color: "#10b981" }}
                        />
                      ) : (
                        <Clock3
                          size={17}
                          style={{ color: "#f59e0b" }}
                        />
                      )}

                      <div>
                        <span>
                          {
                            text
                              .approval
                              .eyebrow
                          }
                        </span>

                        <strong style={{ color: isApproved ? "#10b981" : "#f59e0b" }}>
                          {isApproved
                            ? text.approval.approved
                            : (language === "hi" ? "कॉल की प्रतीक्षा" : "Awaiting Call")}
                        </strong>
                      </div>
                    </div>

                    {isWaitingApproval && (
                      <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "#d1d5db", lineHeight: "1.5" }}>
                          {language === "hi"
                            ? "रिपेयर शुरू करवाने के लिए रिसेप्शनिस्ट को कॉल करें:"
                            : "Call receptionist to confirm approval:"}
                        </p>
                        <a
                          href={`tel:${SHOP_PHONE}`}
                          className="at-track-sidebar-call-btn"
                          id="sidebar-call-btn"
                        >
                          <PhoneCall size={14} />
                          <span>{SHOP_PHONE_DISPLAY}</span>
                        </a>
                      </div>
                    )}

                    {customerApproval?.approvedAt && (
                      <div className="at-track-info-row" style={{ marginTop: "12px" }}>
                        <span>
                          {
                            text
                              .approval
                              .approved
                          }
                        </span>

                        <strong>
                          {formatDate(
                            customerApproval.approvedAt,
                            language
                          )}
                        </strong>
                      </div>
                    )}

                    {isApproved && !customerApproval?.approvedAt && (
                      <div className="at-track-info-row" style={{ marginTop: "12px" }}>
                        <span>
                          {
                            text
                              .approval
                              .approved
                          }
                        </span>

                        <strong style={{ color: "#10b981" }}>
                          {language === "hi" ? "कॉल द्वारा स्वीकृत" : "Confirmed via Call"}
                        </strong>
                      </div>
                    )}

                    {customerApproval?.rejectedAt && (
                      <div className="at-track-info-row">
                        <span>
                          {
                            text
                              .approval
                              .updated
                          }
                        </span>

                        <strong>
                          {formatDate(
                            customerApproval.rejectedAt,
                            language
                          )}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* PAYMENT */}

                  {payment && (
                    <div className="at-track-info-card">
                      <div className="at-track-info-card__heading">
                        <IndianRupee
                          size={17}
                        />

                        <div>
                          <span>
                            {
                              text
                                .payment
                                .eyebrow
                            }
                          </span>

                          <strong>
                            {getLocalizedStatus(
                              payment.status,
                              language,
                              text
                                .payment
                                .pending
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="at-track-info-row">
                        <span>
                          {
                            text.payment
                              .total
                          }
                        </span>

                        <strong>
                          {formatMoney(
                            payment.totalAmount
                          )}
                        </strong>
                      </div>

                      <div className="at-track-info-row">
                        <span>
                          {
                            text.payment
                              .paid
                          }
                        </span>

                        <strong>
                          {formatMoney(
                            payment.paidAmount
                          )}
                        </strong>
                      </div>

                      <div className="at-track-info-row">
                        <span>
                          {
                            text.payment
                              .balance
                          }
                        </span>

                        <strong>
                          {formatMoney(
                            payment.balance
                          )}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* LAST UPDATE */}

                  {repair.updatedAt && (
                    <div className="at-track-update-time">
                      <Clock3
                        size={13}
                      />

                      {
                        text.update
                          .lastUpdated
                      }{" "}

                      {formatDate(
                        repair.updatedAt,
                        language
                      )}
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            HELP
        ================================================= */}

        <section className="at-track-help">
          <div className="at-track-page-shell">
            <div className="at-track-help__card">
              <div>
                <Sparkles
                  size={20}
                />

                <div>
                  <span>
                    {text.help.eyebrow}
                  </span>

                  <h2>
                    {text.help.title}
                  </h2>

                  <p>
                    {text.help.description}
                  </p>
                </div>
              </div>

              <Link
                to="/contact"
                className="at-track-help__button"
              >
                {text.help.button}

                <ArrowRight
                  size={16}
                />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TrackRepair;