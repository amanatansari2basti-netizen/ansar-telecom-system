import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  IndianRupee,
  LockKeyhole,
  PackageCheck,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

import {
  httpsCallable,
} from "firebase/functions";

import { functions } from "../../firebase";

import PublicNavbar from "../components/PublicNavbar";
import { useLanguage } from "../context/LanguageContext";

import "../styles/trackRepair.css";

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
        "Example: AT-1087",

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
        "Pending",

      approved:
        "Approved",

      updated:
        "Updated",
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
        "उदाहरण: AT-1087",

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
        "बाकी है",

      approved:
        "मंजूर किया गया",

      updated:
        "अपडेट",
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
    .replace(/\s+/g, "");
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

  const text =
    trackContent[language] ||
    trackContent.en;

  const [jobId, setJobId] =
    useState("");

  const [phone, setPhone] =
    useState("");

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

  const validate = () => {
    const cleanJobId =
      normalizeJobId(jobId);

    if (!cleanJobId) {
      return text.errors.jobRequired;
    }

    if (
      !/^[A-Z0-9-]{3,30}$/.test(
        cleanJobId
      )
    ) {
      return text.errors.jobInvalid;
    }

    if (
      normalizedPhone.length !==
        10 ||
      !/^[6-9]\d{9}$/.test(
        normalizedPhone
      )
    ) {
      return text.errors.phoneInvalid;
    }

    return "";
  };

  /* =======================================================
     SECURE TRACKING REQUEST
  ======================================================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const validationError =
      validate();

    if (validationError) {
      setError(
        validationError
      );

      setRepair(null);
      setSearched(false);

      return;
    }

    setLoading(true);

    setError("");
    setRepair(null);
    setSearched(false);

    try {
      /*
        IMPORTANT:

        Public browser does NOT query
        repairJobs directly.

        All lookup + phone verification +
        customer-safe response filtering
        happens inside Cloud Function.
      */

      const trackRepair =
        httpsCallable(
          functions,
          "trackRepair"
        );

      const result =
        await trackRepair({
          jobId:
            normalizeJobId(
              jobId
            ),

          phone:
            normalizedPhone,
        });

      const payload =
        result?.data;

      if (
        !payload?.success ||
        !payload?.repair
      ) {
        throw new Error(
          text.search.invalidResponse
        );
      }

      setRepair(
        payload.repair
      );

      setSearched(true);
    } catch (
      requestError
    ) {
      console.error(
        "Track repair error:",
        requestError
      );

      setRepair(null);
      setSearched(true);

      setError(
        getFirebaseErrorMessage(
          requestError,
          text
        )
      );
    } finally {
      setLoading(false);
    }
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
  };

  /* =======================================================
     CURRENT STAGE
  ======================================================= */

  const activeStageIndex =
    repair
      ? getStageIndex(
          repair.repairStage
        )
      : 0;

  /* =======================================================
     OPTIONAL CUSTOMER DATA
  ======================================================= */

  const estimate =
    repair?.estimate || null;

  const customerApproval =
    repair?.customerApproval ||
    null;

  const payment =
    repair?.payment || null;

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

                  {estimate && (
                    <div className="at-track-info-card">
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

                      {estimate.diagnosisSummary && (
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
                              estimate.diagnosisSummary
                            }
                          </strong>
                        </div>
                      )}

                      {estimate.partsRequired && (
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
                              estimate.partsRequired
                            }
                          </strong>
                        </div>
                      )}

                      {Number(
                        estimate.total
                      ) > 0 && (
                        <div className="at-track-info-row">
                          <span>
                            {
                              text
                                .estimate
                                .total
                            }
                          </span>

                          <strong>
                            {formatMoney(
                              estimate.total
                            )}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CUSTOMER APPROVAL */}

                  {customerApproval && (
                    <div className="at-track-info-card">
                      <div className="at-track-info-card__heading">
                        <CheckCircle2
                          size={17}
                        />

                        <div>
                          <span>
                            {
                              text
                                .approval
                                .eyebrow
                            }
                          </span>

                          <strong>
                            {getLocalizedStatus(
                              customerApproval.status,
                              language,
                              text
                                .approval
                                .pending
                            )}
                          </strong>
                        </div>
                      </div>

                      {customerApproval.approvedAt && (
                        <div className="at-track-info-row">
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

                      {customerApproval.rejectedAt && (
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
                  )}

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