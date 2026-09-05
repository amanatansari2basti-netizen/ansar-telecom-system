import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bike,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Home,
  Info,
  Loader2,
  LockKeyhole,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import PublicNavbar from "../components/PublicNavbar";
import { useLanguage } from "../context/LanguageContext";

import "../styles/pickDrop.css";

const translations = {
  en: {
    steps: [
      {
        id: 1,
        short: "Device",
        title: "Device Details",
      },
      {
        id: 2,
        short: "Address",
        title: "Pickup Address",
      },
      {
        id: 3,
        short: "Schedule",
        title: "Pickup Schedule",
      },
      {
        id: 4,
        short: "Review",
        title: "Review Request",
      },
    ],

    journey: [
      {
        icon: Smartphone,
        number: "01",
        title: "Book online",
        text:
          "Tell us about your phone and the problem you are facing.",
      },
      {
        icon: Bike,
        number: "02",
        title: "Doorstep pickup",
        text:
          "Your pickup request moves into the collection process.",
      },
      {
        icon: Wrench,
        number: "03",
        title: "Professional repair",
        text:
          "The device is inspected and handled through the repair workflow.",
      },
      {
        icon: PackageCheck,
        number: "04",
        title: "Return delivery",
        text:
          "After the service process is completed, the device moves toward return delivery.",
      },
    ],

    success: {
      eyebrow: "PICKUP REQUEST",
      titleLine1: "Your request",
      titleLine2: "has been prepared.",
      description:
        "The booking interface is working correctly. Once backend booking is connected, submitted requests will be saved and sent into the Ansar Telecom pickup workflow.",
      customer: "CUSTOMER",
      device: "DEVICE",
      pickup: "PICKUP",
      slot: "SLOT",
      trackRepair: "Track Repair",
      backHome: "Back Home",
      note:
        "Backend request creation, rider assignment and live tracking will be connected with the repair system.",
    },

    hero: {
      eyebrow: "DOOR-TO-DOOR MOBILE REPAIR",
      titleLine1: "We pick it up.",
      titleLine2: "You stay home.",
      description:
        "Request mobile repair pickup from your doorstep. Share your device problem, pickup location and preferred schedule through one simple booking flow.",
      button: "Book a Pickup",
      fromDoorstep: "FROM YOUR DOORSTEP",
      pickup: "Pickup.",
      repair: "Repair.",
      return: "Return.",
      visualText:
        "A more convenient way to get your mobile repaired.",
      start: "START",
      yourDoorstep: "Your Doorstep",
      service: "SERVICE",
      ansarTelecom: "Ansar Telecom",
      returnLabel: "RETURN",
      backToYou: "Back to You",
    },

    journeySection: {
      eyebrow: "01 / HOW IT WORKS",
      titleLine1: "Mobile repair",
      titleLine2: "without the extra trip.",
      description:
        "The complete service journey is designed around a simple pickup, repair and return process.",
    },

    booking: {
      eyebrow: "02 / BOOK YOUR PICKUP",
      titleLine1: "Tell us about",
      titleLine2: "your device.",
      privacyText:
        "Your booking details are used for the service workflow. Personal device content is separate from pickup information.",
      progress: "BOOKING PROGRESS",
      privacyTitle: "Privacy-conscious handling",
      privacyDescription:
        "Device access is not requested simply for pickup.",
    },

    step1: {
      step: "STEP 01",
      title: "Device & customer details",
      description:
        "Start with your contact information and tell us which phone needs repair.",
      name: "Your Name",
      namePlaceholder: "Enter your name",
      phone: "Mobile Number",
      phonePlaceholder: "Enter mobile number",
      brand: "Device Brand",
      brandPlaceholder: "e.g. iPhone, Samsung",
      model: "Device Model",
      modelPlaceholder: "e.g. iPhone 13",
      issue: "What problem are you facing?",
      issuePlaceholder:
        "Describe the problem in your own words...",
      tip:
        "You do not need to know the technical name of the fault. Just describe what you see or what the phone is doing.",
    },

    step2: {
      step: "STEP 02",
      title: "Where should we pick it up?",
      description:
        "Enter the pickup location carefully so the collection process can be handled correctly.",
      address: "Complete Address",
      addressPlaceholder: "House / Shop, road, area...",
      landmark: "Landmark",
      landmarkPlaceholder: "Nearby landmark",
      city: "City",
      cityPlaceholder: "City",
      pincode: "PIN Code",
      pincodePlaceholder: "Enter PIN code",
      tip:
        "Pickup availability can depend on the service area and location. The request is confirmed through the service workflow.",
    },

    step3: {
      step: "STEP 03",
      title: "Choose a preferred pickup time.",
      description:
        "Select your preferred date and a convenient time window for the pickup request.",
      date: "Preferred Date",
      timeWindow: "Preferred Time Window",
      preferredPickup: "Preferred pickup",
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      notes: "Additional Notes",
      optional: "Optional",
      notesPlaceholder:
        "Anything we should know before pickup?",
      tip:
        "This is your preferred pickup window, not an automatic guaranteed rider arrival time. Final pickup timing can be confirmed after the request is accepted.",
    },

    step4: {
      step: "STEP 04",
      title: "Review your pickup request.",
      description:
        "Check the details before submitting your request.",
      device: "DEVICE",
      pickupAddress: "PICKUP ADDRESS",
      schedule: "SCHEDULE",
      edit: "Edit",
      customer: "Customer",
      phone: "Phone",
      deviceLabel: "Device",
      problem: "Problem",
      address: "Address",
      city: "City",
      pin: "PIN",
      date: "Date",
      preferredWindow: "Preferred Window",
      consent:
        "I confirm that the information provided above is correct and understand that the pickup request and repair are subject to service confirmation and device inspection.",
    },

    navigation: {
      back: "Back",
      continue: "Continue",
      submit: "Submit Request",
    },

    after: {
      eyebrow: "03 / AFTER BOOKING",
      titleLine1: "Know what happens",
      titleLine2: "after your request.",
      description:
        "The customer should always understand where the device is in the service journey.",
      items: [
        {
          number: "01",
          title: "Request Received",
          text:
            "Pickup details enter the service workflow.",
        },
        {
          number: "02",
          title: "Pickup Processing",
          text:
            "The request is reviewed for collection.",
        },
        {
          number: "03",
          title: "Rider Assigned",
          text:
            "An available rider can be assigned to the pickup.",
        },
        {
          number: "04",
          title: "Device Collected",
          text:
            "The phone moves toward the service centre.",
        },
        {
          number: "05",
          title: "Repair Process",
          text:
            "Diagnosis and repair are handled through the repair workflow.",
        },
        {
          number: "06",
          title: "Return Delivery",
          text:
            "The completed device moves into the return process.",
        },
      ],
    },

    privacy: {
      eyebrow: "PRIVACY & COMMUNICATION",
      title:
        "Your number does not need to become the rider's contact list.",
      heading: "Designed for controlled communication.",
      description:
        "The final system can keep customer and rider contact details separated and route service communication through the platform or an approved communication layer instead of exposing personal numbers directly.",
      customerPrivacy: "Customer privacy",
      riderPrivacy: "Rider privacy",
      controlledUpdates: "Controlled service updates",
    },

    final: {
      eyebrow: "DOOR-TO-DOOR REPAIR",
      title: "Your repair can start at your door.",
      description:
        "Book your pickup online or contact Ansar Telecom if you want to discuss the device problem first.",
      pickup: "Book a Pickup",
      contact: "Contact Us",
    },
  },

  hi: {
    steps: [
      {
        id: 1,
        short: "डिवाइस",
        title: "डिवाइस की जानकारी",
      },
      {
        id: 2,
        short: "पता",
        title: "पिकअप का पता",
      },
      {
        id: 3,
        short: "समय",
        title: "पिकअप शेड्यूल",
      },
      {
        id: 4,
        short: "जांच",
        title: "रिक्वेस्ट की जांच",
      },
    ],

    journey: [
      {
        icon: Smartphone,
        number: "01",
        title: "ऑनलाइन बुक करें",
        text:
          "अपने फोन और उसमें आ रही समस्या की जानकारी हमें दें।",
      },
      {
        icon: Bike,
        number: "02",
        title: "घर से पिकअप",
        text:
          "आपकी पिकअप रिक्वेस्ट डिवाइस कलेक्शन प्रक्रिया में भेजी जाती है।",
      },
      {
        icon: Wrench,
        number: "03",
        title: "प्रोफेशनल रिपेयर",
        text:
          "डिवाइस की जांच करके उसे व्यवस्थित रिपेयर प्रक्रिया के अनुसार संभाला जाता है।",
      },
      {
        icon: PackageCheck,
        number: "04",
        title: "वापस डिलीवरी",
        text:
          "सर्विस प्रक्रिया पूरी होने के बाद डिवाइस को वापस डिलीवरी के लिए भेजा जाता है।",
      },
    ],

    success: {
      eyebrow: "पिकअप रिक्वेस्ट",
      titleLine1: "आपकी रिक्वेस्ट",
      titleLine2: "तैयार हो गई है।",
      description:
        "बुकिंग इंटरफेस सही तरीके से काम कर रहा है। Backend booking जुड़ने के बाद सबमिट की गई रिक्वेस्ट सेव होकर Ansar Telecom के पिकअप वर्कफ्लो में भेजी जाएगी।",
      customer: "ग्राहक",
      device: "डिवाइस",
      pickup: "पिकअप",
      slot: "समय",
      trackRepair: "रिपेयर ट्रैक करें",
      backHome: "होम पर जाएं",
      note:
        "Backend request creation, rider assignment और live tracking को repair system के साथ जोड़ा जाएगा।",
    },

    hero: {
      eyebrow: "घर से मोबाइल रिपेयर सेवा",
      titleLine1: "हम फोन ले जाएंगे।",
      titleLine2: "आप घर पर रहें।",
      description:
        "अपने घर से मोबाइल रिपेयर पिकअप की रिक्वेस्ट करें। एक आसान बुकिंग प्रक्रिया में डिवाइस की समस्या, पिकअप लोकेशन और अपनी पसंद का समय बताएं।",
      button: "पिकअप बुक करें",
      fromDoorstep: "आपके घर से",
      pickup: "पिकअप।",
      repair: "रिपेयर।",
      return: "वापसी।",
      visualText:
        "अपने मोबाइल को रिपेयर कराने का एक अधिक सुविधाजनक तरीका।",
      start: "शुरुआत",
      yourDoorstep: "आपका घर",
      service: "सर्विस",
      ansarTelecom: "Ansar Telecom",
      returnLabel: "वापसी",
      backToYou: "आपके पास वापस",
    },

    journeySection: {
      eyebrow: "01 / यह कैसे काम करता है",
      titleLine1: "मोबाइल रिपेयर",
      titleLine2: "बिना दुकान आने की परेशानी के।",
      description:
        "पूरी सर्विस प्रक्रिया को आसान पिकअप, रिपेयर और वापसी के अनुसार तैयार किया गया है।",
    },

    booking: {
      eyebrow: "02 / अपना पिकअप बुक करें",
      titleLine1: "हमें अपने",
      titleLine2: "डिवाइस के बारे में बताएं।",
      privacyText:
        "आपकी बुकिंग जानकारी का उपयोग सर्विस प्रक्रिया के लिए किया जाता है। आपके डिवाइस का निजी डेटा पिकअप जानकारी से अलग रहता है।",
      progress: "बुकिंग की प्रगति",
      privacyTitle: "प्राइवेसी का ध्यान",
      privacyDescription:
        "सिर्फ पिकअप के लिए डिवाइस खोलने या उसका एक्सेस देने की आवश्यकता नहीं है।",
    },

    step1: {
      step: "स्टेप 01",
      title: "डिवाइस और ग्राहक की जानकारी",
      description:
        "अपनी संपर्क जानकारी दें और बताएं कि किस फोन को रिपेयर कराना है।",
      name: "आपका नाम",
      namePlaceholder: "अपना नाम दर्ज करें",
      phone: "मोबाइल नंबर",
      phonePlaceholder: "मोबाइल नंबर दर्ज करें",
      brand: "डिवाइस ब्रांड",
      brandPlaceholder: "जैसे iPhone, Samsung",
      model: "डिवाइस मॉडल",
      modelPlaceholder: "जैसे iPhone 13",
      issue: "आपके फोन में क्या समस्या आ रही है?",
      issuePlaceholder:
        "समस्या को अपने शब्दों में बताएं...",
      tip:
        "आपको समस्या का तकनीकी नाम जानने की जरूरत नहीं है। बस बताएं कि स्क्रीन पर क्या दिख रहा है या फोन किस तरह की समस्या कर रहा है।",
    },

    step2: {
      step: "स्टेप 02",
      title: "फोन कहां से पिकअप करना है?",
      description:
        "पिकअप का पता ध्यान से दर्ज करें ताकि डिवाइस कलेक्शन सही तरीके से किया जा सके।",
      address: "पूरा पता",
      addressPlaceholder: "मकान / दुकान, सड़क, क्षेत्र...",
      landmark: "लैंडमार्क",
      landmarkPlaceholder: "नजदीकी पहचान वाली जगह",
      city: "शहर",
      cityPlaceholder: "शहर",
      pincode: "पिन कोड",
      pincodePlaceholder: "पिन कोड दर्ज करें",
      tip:
        "पिकअप की उपलब्धता सर्विस एरिया और लोकेशन पर निर्भर कर सकती है। रिक्वेस्ट की पुष्टि सर्विस प्रक्रिया के माध्यम से की जाएगी।",
    },

    step3: {
      step: "स्टेप 03",
      title: "पिकअप का पसंदीदा समय चुनें।",
      description:
        "अपनी पसंद की तारीख और पिकअप के लिए सुविधाजनक समय चुनें।",
      date: "पसंदीदा तारीख",
      timeWindow: "पसंदीदा समय",
      preferredPickup: "पसंदीदा पिकअप",
      morning: "सुबह",
      afternoon: "दोपहर",
      evening: "शाम",
      notes: "अतिरिक्त जानकारी",
      optional: "वैकल्पिक",
      notesPlaceholder:
        "क्या पिकअप से पहले हमें कुछ और जानना चाहिए?",
      tip:
        "यह आपका पसंदीदा पिकअप समय है, Rider के पहुंचने का निश्चित समय नहीं। रिक्वेस्ट स्वीकार होने के बाद अंतिम पिकअप समय की पुष्टि की जा सकती है।",
    },

    step4: {
      step: "स्टेप 04",
      title: "अपनी पिकअप रिक्वेस्ट जांचें।",
      description:
        "रिक्वेस्ट सबमिट करने से पहले सभी जानकारी जांच लें।",
      device: "डिवाइस",
      pickupAddress: "पिकअप का पता",
      schedule: "शेड्यूल",
      edit: "बदलें",
      customer: "ग्राहक",
      phone: "फोन",
      deviceLabel: "डिवाइस",
      problem: "समस्या",
      address: "पता",
      city: "शहर",
      pin: "पिन",
      date: "तारीख",
      preferredWindow: "पसंदीदा समय",
      consent:
        "मैं पुष्टि करता/करती हूं कि ऊपर दी गई जानकारी सही है और समझता/समझती हूं कि पिकअप रिक्वेस्ट और रिपेयर सर्विस की पुष्टि तथा डिवाइस की जांच पर निर्भर है।",
    },

    navigation: {
      back: "वापस",
      continue: "आगे बढ़ें",
      submit: "रिक्वेस्ट सबमिट करें",
    },

    after: {
      eyebrow: "03 / बुकिंग के बाद",
      titleLine1: "जानें आपकी रिक्वेस्ट के बाद",
      titleLine2: "क्या होता है।",
      description:
        "ग्राहक को यह समझ आना चाहिए कि उसका डिवाइस सर्विस प्रक्रिया में किस चरण पर है।",
      items: [
        {
          number: "01",
          title: "रिक्वेस्ट प्राप्त",
          text:
            "पिकअप की जानकारी सर्विस वर्कफ्लो में पहुंचती है।",
        },
        {
          number: "02",
          title: "पिकअप प्रोसेसिंग",
          text:
            "डिवाइस कलेक्शन के लिए रिक्वेस्ट की जांच की जाती है।",
        },
        {
          number: "03",
          title: "Rider Assigned",
          text:
            "उपलब्ध Rider को पिकअप के लिए असाइन किया जा सकता है।",
        },
        {
          number: "04",
          title: "डिवाइस कलेक्ट",
          text:
            "फोन सर्विस सेंटर की ओर भेजा जाता है।",
        },
        {
          number: "05",
          title: "रिपेयर प्रक्रिया",
          text:
            "डिवाइस की जांच और रिपेयर, repair workflow के अनुसार की जाती है।",
        },
        {
          number: "06",
          title: "वापस डिलीवरी",
          text:
            "रिपेयर पूरा होने के बाद डिवाइस वापसी की प्रक्रिया में जाता है।",
        },
      ],
    },

    privacy: {
      eyebrow: "प्राइवेसी और कम्युनिकेशन",
      title:
        "आपका नंबर Rider की निजी contact list का हिस्सा बनने की जरूरत नहीं है।",
      heading:
        "नियंत्रित कम्युनिकेशन को ध्यान में रखकर बनाया गया सिस्टम।",
      description:
        "अंतिम सिस्टम ग्राहक और Rider की संपर्क जानकारी को एक-दूसरे से अलग रख सकता है और निजी नंबर सीधे दिखाने के बजाय प्लेटफॉर्म या स्वीकृत communication layer के माध्यम से सर्विस कम्युनिकेशन कर सकता है।",
      customerPrivacy: "ग्राहक की प्राइवेसी",
      riderPrivacy: "Rider की प्राइवेसी",
      controlledUpdates: "नियंत्रित सर्विस अपडेट",
    },

    final: {
      eyebrow: "घर से पिकअप और डिलीवरी",
      title:
        "आपके फोन की रिपेयर आपके घर से शुरू हो सकती है।",
      description:
        "ऑनलाइन पिकअप बुक करें या डिवाइस की समस्या के बारे में पहले बात करना चाहते हैं तो Ansar Telecom से संपर्क करें।",
      pickup: "पिकअप बुक करें",
      contact: "संपर्क करें",
    },
  },
};

const pickupSlots = [
  {
    value: "Morning",
    key: "morning",
  },
  {
    value: "Afternoon",
    key: "afternoon",
  },
  {
    value: "Evening",
    key: "evening",
  },
];

const normalizeIndianPhone = (value = "") => {
  let digits = String(value).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits.slice(-10);
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

function PickDrop() {
  const { language } = useLanguage();

  const text =
    translations[language] ||
    translations.en;

  const steps = text.steps;
  const serviceJourney =
    text.journey;

  const [currentStep, setCurrentStep] =
    useState(1);

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const [createdJobId, setCreatedJobId] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [formData, setFormData] =
    useState({
      customerName: "",
      phone: "",
      brand: "",
      model: "",
      issue: "",
      address: "",
      landmark: "",
      city: "Basti",
      pincode: "",
      pickupDate: "",
      pickupSlot: "",
      notes: "",
      consent: false,
    });

  const updateField = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (submitError) {
      setSubmitError("");
    }
  };

  const stepOneComplete =
    formData.customerName.trim() &&
    formData.phone.trim() &&
    formData.brand.trim() &&
    formData.model.trim() &&
    formData.issue.trim();

  const stepTwoComplete =
    formData.address.trim() &&
    formData.city.trim() &&
    formData.pincode.trim();

  const stepThreeComplete =
    formData.pickupDate &&
    formData.pickupSlot;

  const canContinue = useMemo(
    () => {
      if (currentStep === 1) {
        return Boolean(
          stepOneComplete
        );
      }

      if (currentStep === 2) {
        return Boolean(
          stepTwoComplete
        );
      }

      if (currentStep === 3) {
        return Boolean(
          stepThreeComplete
        );
      }

      return true;
    },
    [
      currentStep,
      stepOneComplete,
      stepTwoComplete,
      stepThreeComplete,
    ]
  );

  const goNext = () => {
    if (!canContinue) return;

    setCurrentStep(
      (previous) =>
        Math.min(
          previous + 1,
          4
        )
    );

    window.scrollTo({
      top: 480,
      behavior: "smooth",
    });
  };

  const goBack = () => {
    setCurrentStep(
      (previous) =>
        Math.max(
          previous - 1,
          1
        )
    );
  };

  const editStep = (step) => {
    setCurrentStep(step);

    window.scrollTo({
      top: 480,
      behavior: "smooth",
    });
  };

  const submitRequest = async (event) => {
    event.preventDefault();

    if (!formData.consent || submitting) {
      return;
    }

    const cleanPhone = normalizeIndianPhone(formData.phone);

    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setSubmitError(
        language === "hi"
          ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।"
          : "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const counterRef = doc(db, "counters", "repairJobs");
      let nextJobId = "";

      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextNumber = 1050;

        if (counterDoc.exists()) {
          nextNumber = toNumber(counterDoc.data().lastNumber || 1049) + 1;
        }

        nextJobId = `AT-${nextNumber}`;

        transaction.set(
          counterRef,
          {
            lastNumber: nextNumber,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        const repairJobRef = doc(db, "repairJobs", nextJobId);
        const fullAddress = [
          formData.address.trim(),
          formData.landmark.trim() ? `Near ${formData.landmark.trim()}` : "",
          formData.city.trim() || "Basti",
          formData.pincode.trim() ? `- ${formData.pincode.trim()}` : "",
        ]
          .filter(Boolean)
          .join(", ");

        const fullDeviceName = `${formData.brand.trim()} ${formData.model.trim()}`.trim();

        // 1. Save to repairJobs (official system repair job)
        transaction.set(repairJobRef, {
          id: nextJobId,
          jobId: nextJobId,
          source: "pick_and_drop",
          isPickDrop: true,
          taskType: "pickup",
          customerName: formData.customerName.trim(),
          customer: formData.customerName.trim(),
          phone: cleanPhone,
          mobileNumber: cleanPhone,
          customerPhone: cleanPhone,
          registeredPhoneLast3: cleanPhone.slice(-3),
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          device: fullDeviceName,
          deviceModel: fullDeviceName,
          reportedProblem: formData.issue.trim(),
          problem: formData.issue.trim(),
          issue: formData.issue.trim(),
          pickupAddress: {
            address: formData.address.trim(),
            landmark: formData.landmark.trim(),
            city: formData.city.trim() || "Basti",
            pincode: formData.pincode.trim(),
          },
          address: fullAddress,
          customerAddress: fullAddress,
          pickupDate: formData.pickupDate,
          pickupSlot: formData.pickupSlot,
          pickupNotes: formData.notes.trim(),
          priority: "Normal",
          status: "Pending",
          repairStage: "Device Received",
          customerStatus: "Pickup request registered. Rider notification dispatched.",
          customerStatusCode: "PICKUP_REQUESTED",
          riderStatus: "rider_assigned",
          assignedRiderId: "all_or_available",
          assignedRiderName: "Awaiting Acceptance",
          delivery: {
            method: "Pick & Drop",
            status: "Pickup Pending",
          },
          isNewPickupNotification: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 2. Save to pickupRequests (dedicated rider and logistics pipeline)
        const pickupRequestRef = doc(db, "pickupRequests", nextJobId);
        const baseLatitude = 26.7995 + (Math.random() - 0.5) * 0.02;
        const baseLongitude = 82.7630 + (Math.random() - 0.5) * 0.02;

        transaction.set(pickupRequestRef, {
          id: nextJobId,
          pickupId: nextJobId,
          requestId: nextJobId,
          jobId: nextJobId,
          taskType: "pickup",
          status: "rider_assigned",
          isNewNotification: true,
          customerName: formData.customerName.trim(),
          customer: {
            name: formData.customerName.trim(),
            phone: cleanPhone,
            mobile: cleanPhone,
          },
          phone: cleanPhone,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          deviceBrand: formData.brand.trim(),
          deviceModel: formData.model.trim(),
          device: fullDeviceName,
          problem: formData.issue.trim(),
          issue: formData.issue.trim(),
          pickupAddress: {
            address: formData.address.trim(),
            landmark: formData.landmark.trim(),
            city: formData.city.trim() || "Basti",
            pincode: formData.pincode.trim(),
          },
          address: fullAddress,
          customerAddress: fullAddress,
          pickupDate: formData.pickupDate,
          pickupTime: formData.pickupSlot,
          pickupSlot: formData.pickupSlot,
          notes: formData.notes.trim(),
          pickupLocation: {
            latitude: baseLatitude,
            longitude: baseLongitude,
            city: formData.city.trim() || "Basti",
          },
          riderLocation: {
            latitude: 26.8010,
            longitude: 82.7600,
            updatedAt: new Date().toISOString(),
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      setCreatedJobId(nextJobId);
      setSubmitted(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Pickup submission error:", err);
      setSubmitError(
        language === "hi"
          ? "पिकअप रिक्वेस्ट सबमिट करने में समस्या आई। कृपया पुनः प्रयास करें।"
          : "Unable to submit pickup request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotLabel = (slotValue) => {
    const slot = pickupSlots.find(
      (item) =>
        item.value === slotValue
    );

    if (!slot) {
      return slotValue;
    }

    return text.step3[slot.key];
  };

  const copyJobId = () => {
    if (!createdJobId) return;
    navigator.clipboard.writeText(createdJobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    const cleanPhone = normalizeIndianPhone(formData.phone);

    return (
      <div className="at-pickdrop-page">
        <PublicNavbar />

        <main className="at-pickdrop-success">
          <div className="at-pickdrop-shell">
            <div className="at-pickdrop-success__box">
              <div className="at-pickdrop-success__icon">
                <CheckCircle2
                  size={36}
                  strokeWidth={1.6}
                />
              </div>

              <span className="at-pickdrop-eyebrow">
                {language === "hi" ? "पिकअप अनुरोध दर्ज हो गया" : "PICKUP REQUEST SUBMITTED"}
              </span>

              <h1>
                {language === "hi" ? (
                  <>
                    आपकी रिक्वेस्ट सफलतापूर्वक
                    <br />
                    <span>दर्ज कर ली गई है।</span>
                  </>
                ) : (
                  <>
                    {text.success.titleLine1}
                    <br />
                    <span>{text.success.titleLine2}</span>
                  </>
                )}
              </h1>

              {createdJobId && (
                <div style={{
                  margin: "18px auto 24px",
                  padding: "16px 24px",
                  background: "#12130f",
                  borderRadius: "14px",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "14px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
                }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#f4c400", fontWeight: 700 }}>
                      {language === "hi" ? "आपका रिपेयर जॉब ID" : "YOUR REPAIR JOB ID"}
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "0.5px" }}>
                      {createdJobId}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={copyJobId}
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "none",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {copied ? <Check size={14} color="#f4c400" /> : <Copy size={14} />}
                    {copied ? (language === "hi" ? "कॉपी हो गया" : "Copied!") : (language === "hi" ? "कॉपी" : "Copy")}
                  </button>
                </div>
              )}

              <p>
                {language === "hi"
                  ? `आपकी पिकअप जानकारी Ansar Telecom और Rider टीम को भेज दी गई है। Rider जल्द ही आपके दिए गए पते पर पहुंचेगा। आप नीचे दिए गए बटन से अपने फोन और Rider को Live Track कर सकते हैं।`
                  : `Your pickup request has been auto-saved to Ansar Telecom Repair Jobs and dispatched to the Rider Network. You can track your device and rider live.`}
              </p>

              <div className="at-pickdrop-success__summary">
                <div>
                  <span>
                    {text.success.customer}
                  </span>

                  <strong>
                    {formData.customerName}
                  </strong>
                </div>

                <div>
                  <span>
                    {text.success.device}
                  </span>

                  <strong>
                    {formData.brand}{" "}
                    {formData.model}
                  </strong>
                </div>

                <div>
                  <span>
                    {text.success.pickup}
                  </span>

                  <strong>
                    {formData.pickupDate}
                  </strong>
                </div>

                <div>
                  <span>
                    {text.success.slot}
                  </span>

                  <strong>
                    {getSlotLabel(
                      formData.pickupSlot
                    )}
                  </strong>
                </div>
              </div>

              <div className="at-pickdrop-success__actions">
                <Link
                  to={`/track?jobId=${createdJobId}&phone=${cleanPhone}`}
                  className="at-pickdrop-primary-button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <Bike size={18} />
                  {language === "hi" ? "Live Rider & Repair ट्रैक करें" : "Track Live Rider & Repair"}
                  <ArrowUpRight size={16} />
                </Link>

                <Link
                  to="/"
                  className="at-pickdrop-outline-button"
                >
                  {text.success.backHome}
                </Link>
              </div>

              <small>
                {language === "hi"
                  ? "नोट: रिपेयर जॉब ID सुरक्षित रखें। इसे Track Repair पेज पर कभी भी उपयोग किया जा सकता है।"
                  : "Keep your Repair Job ID safe. You can track device status and rider location in real-time."}
              </small>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="at-pickdrop-page">
      <PublicNavbar />

      <main>
        {/* =============================================
            HERO
        ============================================= */}

        <section className="at-pickdrop-hero">
          <div className="at-pickdrop-shell">
            <div className="at-pickdrop-hero__grid">
              <div className="at-pickdrop-hero__heading">
                <span className="at-pickdrop-eyebrow">
                  {text.hero.eyebrow}
                </span>

                <h1>
                  {text.hero.titleLine1}
                  <br />

                  <span>
                    {text.hero.titleLine2}
                  </span>
                </h1>
              </div>

              <div className="at-pickdrop-hero__copy">
                <p>
                  {text.hero.description}
                </p>

                <a
                  href="#book-pickup"
                  className="at-pickdrop-primary-button"
                >
                  {text.hero.button}

                  <ArrowRight size={16} />
                </a>
              </div>
            </div>

            <div className="at-pickdrop-hero__visual">
              <div className="at-pickdrop-hero__visual-content">
                <span>
                  {text.hero.fromDoorstep}
                </span>

                <h2>
                  {text.hero.pickup}
                  <br />
                  {text.hero.repair}
                  <br />
                  {text.hero.return}
                </h2>

                <p>
                  {text.hero.visualText}
                </p>
              </div>

              <div className="at-pickdrop-hero__route">
                <div className="at-pickdrop-route-point">
                  <span>
                    <Home size={18} />
                  </span>

                  <div>
                    <small>
                      {text.hero.start}
                    </small>

                    <strong>
                      {text.hero.yourDoorstep}
                    </strong>
                  </div>
                </div>

                <div className="at-pickdrop-route-line">
                  <span />
                  <Bike size={21} />
                  <span />
                </div>

                <div className="at-pickdrop-route-point">
                  <span>
                    <Wrench size={18} />
                  </span>

                  <div>
                    <small>
                      {text.hero.service}
                    </small>

                    <strong>
                      {text.hero.ansarTelecom}
                    </strong>
                  </div>
                </div>

                <div className="at-pickdrop-route-line">
                  <span />
                  <Truck size={21} />
                  <span />
                </div>

                <div className="at-pickdrop-route-point">
                  <span>
                    <PackageCheck
                      size={18}
                    />
                  </span>

                  <div>
                    <small>
                      {text.hero.returnLabel}
                    </small>

                    <strong>
                      {text.hero.backToYou}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================
            JOURNEY
        ============================================= */}

        <section className="at-pickdrop-journey">
          <div className="at-pickdrop-shell">
            <div className="at-pickdrop-section-heading">
              <div>
                <span className="at-pickdrop-eyebrow">
                  {text.journeySection.eyebrow}
                </span>

                <h2>
                  {text.journeySection.titleLine1}
                  <br />

                  <span>
                    {text.journeySection.titleLine2}
                  </span>
                </h2>
              </div>

              <p>
                {text.journeySection.description}
              </p>
            </div>

            <div className="at-pickdrop-journey__grid">
              {serviceJourney.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <article
                      key={item.number}
                    >
                      <span>
                        {item.number}
                      </span>

                      <div className="at-pickdrop-journey__icon">
                        <Icon
                          size={23}
                          strokeWidth={1.65}
                        />
                      </div>

                      <h3>
                        {item.title}
                      </h3>

                      <p>
                        {item.text}
                      </p>
                    </article>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            BOOKING FORM
        ============================================= */}

        <section
          className="at-pickdrop-booking"
          id="book-pickup"
        >
          <div className="at-pickdrop-shell">
            <div className="at-pickdrop-booking__header">
              <div>
                <span className="at-pickdrop-eyebrow">
                  {text.booking.eyebrow}
                </span>

                <h2>
                  {text.booking.titleLine1}
                  <br />

                  <span>
                    {text.booking.titleLine2}
                  </span>
                </h2>
              </div>

              <div className="at-pickdrop-booking__header-note">
                <ShieldCheck size={21} />

                <p>
                  {text.booking.privacyText}
                </p>
              </div>
            </div>

            <div className="at-pickdrop-booking__layout">
              {/* =======================================
                  LEFT STEPS
              ======================================= */}

              <aside className="at-pickdrop-steps">
                <div className="at-pickdrop-steps__top">
                  <span>
                    {text.booking.progress}
                  </span>

                  <strong>
                    {currentStep}/4
                  </strong>
                </div>

                <div className="at-pickdrop-steps__list">
                  {steps.map(
                    (step) => {
                      const active =
                        currentStep ===
                        step.id;

                      const completed =
                        currentStep >
                        step.id;

                      return (
                        <button
                          type="button"
                          key={step.id}
                          onClick={() => {
                            if (
                              completed
                            ) {
                              editStep(
                                step.id
                              );
                            }
                          }}
                          className={`at-pickdrop-step ${
                            active
                              ? "is-active"
                              : ""
                          } ${
                            completed
                              ? "is-complete"
                              : ""
                          }`}
                        >
                          <span className="at-pickdrop-step__number">
                            {completed ? (
                              <Check
                                size={13}
                              />
                            ) : (
                              `0${step.id}`
                            )}
                          </span>

                          <span className="at-pickdrop-step__copy">
                            <small>
                              {step.short}
                            </small>

                            <strong>
                              {step.title}
                            </strong>
                          </span>

                          <ChevronRight
                            size={15}
                          />
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="at-pickdrop-steps__privacy">
                  <LockKeyhole
                    size={19}
                  />

                  <div>
                    <strong>
                      {
                        text.booking
                          .privacyTitle
                      }
                    </strong>

                    <p>
                      {
                        text.booking
                          .privacyDescription
                      }
                    </p>
                  </div>
                </div>
              </aside>

              {/* =======================================
                  RIGHT FORM
              ======================================= */}

              <form
                className="at-pickdrop-form"
                onSubmit={
                  submitRequest
                }
              >
                {currentStep === 1 && (
                  <div className="at-pickdrop-form__step">
                    <div className="at-pickdrop-form__title">
                      <span>
                        {text.step1.step}
                      </span>

                      <h3>
                        {text.step1.title}
                      </h3>

                      <p>
                        {text.step1.description}
                      </p>
                    </div>

                    <div className="at-pickdrop-fields at-pickdrop-fields--two">
                      <label className="at-pickdrop-field">
                        <span>
                          {text.step1.name}
                        </span>

                        <div>
                          <UserRound
                            size={16}
                          />

                          <input
                            type="text"
                            name="customerName"
                            value={
                              formData.customerName
                            }
                            onChange={
                              updateField
                            }
                            placeholder={
                              text.step1
                                .namePlaceholder
                            }
                            autoComplete="name"
                          />
                        </div>
                      </label>

                      <label className="at-pickdrop-field">
                        <span>
                          {text.step1.phone}
                        </span>

                        <div>
                          <Phone size={16} />

                          <input
                            type="tel"
                            name="phone"
                            value={
                              formData.phone
                            }
                            onChange={
                              updateField
                            }
                            placeholder={
                              text.step1
                                .phonePlaceholder
                            }
                            autoComplete="tel"
                          />
                        </div>
                      </label>

                      <label className="at-pickdrop-field">
                        <span>
                          {text.step1.brand}
                        </span>

                        <div>
                          <Smartphone
                            size={16}
                          />

                          <input
                            type="text"
                            name="brand"
                            value={
                              formData.brand
                            }
                            onChange={
                              updateField
                            }
                            placeholder={
                              text.step1
                                .brandPlaceholder
                            }
                          />
                        </div>
                      </label>

                      <label className="at-pickdrop-field">
                        <span>
                          {text.step1.model}
                        </span>

                        <div>
                          <Smartphone
                            size={16}
                          />

                          <input
                            type="text"
                            name="model"
                            value={
                              formData.model
                            }
                            onChange={
                              updateField
                            }
                            placeholder={
                              text.step1
                                .modelPlaceholder
                            }
                          />
                        </div>
                      </label>
                    </div>

                    <label className="at-pickdrop-field at-pickdrop-field--textarea">
                      <span>
                        {text.step1.issue}
                      </span>

                      <textarea
                        name="issue"
                        value={
                          formData.issue
                        }
                        onChange={
                          updateField
                        }
                        placeholder={
                          text.step1
                            .issuePlaceholder
                        }
                        rows="5"
                      />
                    </label>

                    <div className="at-pickdrop-form__tip">
                      <Info size={16} />

                      <p>
                        {text.step1.tip}
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="at-pickdrop-form__step">
                    <div className="at-pickdrop-form__title">
                      <span>
                        {text.step2.step}
                      </span>

                      <h3>
                        {text.step2.title}
                      </h3>

                      <p>
                        {text.step2.description}
                      </p>
                    </div>

                    <label className="at-pickdrop-field at-pickdrop-field--textarea">
                      <span>
                        {text.step2.address}
                      </span>

                      <div className="at-pickdrop-address-field">
                        <MapPin
                          size={17}
                        />

                        <textarea
                          name="address"
                          value={
                            formData.address
                          }
                          onChange={
                            updateField
                          }
                          placeholder={
                            text.step2
                              .addressPlaceholder
                          }
                          rows="4"
                        />
                      </div>
                    </label>

                    <div className="at-pickdrop-fields at-pickdrop-fields--two">
                      <label className="at-pickdrop-field">
                        <span>
                          {text.step2.landmark}
                        </span>

                        <div>
                          <MapPin
                            size={16}
                          />

                          <input
                            type="text"
                            name="landmark"
                            value={
                              formData.landmark
                            }
                            onChange={
                              updateField
                            }
                            placeholder={
                              text.step2
                                .landmarkPlaceholder
                            }
                          />
                        </div>
                      </label>

                      <label className="at-pickdrop-field">
                        <span>
                          {text.step2.city}
                        </span>

                        <div>
                          <MapPin
                            size={16}
                          />

                          <input
                            type="text"
                            name="city"
                            value={
                              formData.city
                            }
                            onChange={
                              updateField
                            }
                            placeholder={
                              text.step2
                                .cityPlaceholder
                            }
                          />
                        </div>
                      </label>

                      <label className="at-pickdrop-field">
                        <span>
                          {text.step2.pincode}
                        </span>

                        <div>
                          <Home size={16} />

                          <input
                            type="text"
                            name="pincode"
                            value={
                              formData.pincode
                            }
                            onChange={
                              updateField
                            }
                            placeholder={
                              text.step2
                                .pincodePlaceholder
                            }
                            inputMode="numeric"
                          />
                        </div>
                      </label>
                    </div>

                    <div className="at-pickdrop-form__tip">
                      <MapPin
                        size={16}
                      />

                      <p>
                        {text.step2.tip}
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="at-pickdrop-form__step">
                    <div className="at-pickdrop-form__title">
                      <span>
                        {text.step3.step}
                      </span>

                      <h3>
                        {text.step3.title}
                      </h3>

                      <p>
                        {text.step3.description}
                      </p>
                    </div>

                    <label className="at-pickdrop-field">
                      <span>
                        {text.step3.date}
                      </span>

                      <div>
                        <CalendarDays
                          size={16}
                        />

                        <input
                          type="date"
                          name="pickupDate"
                          value={
                            formData.pickupDate
                          }
                          onChange={
                            updateField
                          }
                        />
                      </div>
                    </label>

                    <div className="at-pickdrop-slot-group">
                      <span>
                        {text.step3.timeWindow}
                      </span>

                      <div className="at-pickdrop-slots">
                        {pickupSlots.map(
                          (slot) => (
                            <label
                              key={
                                slot.value
                              }
                              className={`at-pickdrop-slot ${
                                formData.pickupSlot ===
                                slot.value
                                  ? "is-selected"
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="pickupSlot"
                                value={
                                  slot.value
                                }
                                checked={
                                  formData.pickupSlot ===
                                  slot.value
                                }
                                onChange={
                                  updateField
                                }
                              />

                              <Clock3
                                size={18}
                              />

                              <strong>
                                {
                                  text.step3[
                                    slot.key
                                  ]
                                }
                              </strong>

                              <span>
                                {
                                  text.step3
                                    .preferredPickup
                                }
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    <label className="at-pickdrop-field at-pickdrop-field--textarea">
                      <span>
                        {text.step3.notes}

                        <small>
                          {text.step3.optional}
                        </small>
                      </span>

                      <textarea
                        name="notes"
                        value={
                          formData.notes
                        }
                        onChange={
                          updateField
                        }
                        placeholder={
                          text.step3
                            .notesPlaceholder
                        }
                        rows="4"
                      />
                    </label>

                    <div className="at-pickdrop-form__tip">
                      <Clock3
                        size={16}
                      />

                      <p>
                        {text.step3.tip}
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="at-pickdrop-form__step">
                    <div className="at-pickdrop-form__title">
                      <span>
                        {text.step4.step}
                      </span>

                      <h3>
                        {text.step4.title}
                      </h3>

                      <p>
                        {text.step4.description}
                      </p>
                    </div>

                    <div className="at-pickdrop-review">
                      <div className="at-pickdrop-review__section">
                        <div className="at-pickdrop-review__heading">
                          <span>
                            {text.step4.device}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              editStep(1)
                            }
                          >
                            {text.step4.edit}
                          </button>
                        </div>

                        <div className="at-pickdrop-review__data">
                          <div>
                            <span>
                              {
                                text.step4
                                  .customer
                              }
                            </span>

                            <strong>
                              {
                                formData.customerName
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              {text.step4.phone}
                            </span>

                            <strong>
                              {formData.phone}
                            </strong>
                          </div>

                          <div>
                            <span>
                              {
                                text.step4
                                  .deviceLabel
                              }
                            </span>

                            <strong>
                              {formData.brand}{" "}
                              {formData.model}
                            </strong>
                          </div>

                          <div className="at-pickdrop-review__wide">
                            <span>
                              {
                                text.step4
                                  .problem
                              }
                            </span>

                            <strong>
                              {formData.issue}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="at-pickdrop-review__section">
                        <div className="at-pickdrop-review__heading">
                          <span>
                            {
                              text.step4
                                .pickupAddress
                            }
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              editStep(2)
                            }
                          >
                            {text.step4.edit}
                          </button>
                        </div>

                        <div className="at-pickdrop-review__data">
                          <div className="at-pickdrop-review__wide">
                            <span>
                              {
                                text.step4
                                  .address
                              }
                            </span>

                            <strong>
                              {
                                formData.address
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              {text.step4.city}
                            </span>

                            <strong>
                              {formData.city}
                            </strong>
                          </div>

                          <div>
                            <span>
                              {text.step4.pin}
                            </span>

                            <strong>
                              {
                                formData.pincode
                              }
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="at-pickdrop-review__section">
                        <div className="at-pickdrop-review__heading">
                          <span>
                            {
                              text.step4
                                .schedule
                            }
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              editStep(3)
                            }
                          >
                            {text.step4.edit}
                          </button>
                        </div>

                        <div className="at-pickdrop-review__data">
                          <div>
                            <span>
                              {text.step4.date}
                            </span>

                            <strong>
                              {
                                formData.pickupDate
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              {
                                text.step4
                                  .preferredWindow
                              }
                            </span>

                            <strong>
                              {getSlotLabel(
                                formData.pickupSlot
                              )}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <label className="at-pickdrop-consent">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={
                          formData.consent
                        }
                        onChange={
                          updateField
                        }
                      />

                      <span className="at-pickdrop-consent__check">
                        <Check
                          size={13}
                        />
                      </span>

                      <p>
                        {text.step4.consent}
                      </p>
                    </label>
                  </div>
                )}

                {/* =======================================
                    FORM NAVIGATION
                ======================================= */}

                <div className="at-pickdrop-form__navigation">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      className="at-pickdrop-back-button"
                      onClick={
                        goBack
                      }
                    >
                      <ArrowLeft
                        size={15}
                      />

                      {text.navigation.back}
                    </button>
                  ) : (
                    <span />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      className="at-pickdrop-next-button"
                      onClick={
                        goNext
                      }
                      disabled={
                        !canContinue
                      }
                    >
                      {
                        text.navigation
                          .continue
                      }

                      <ArrowRight
                        size={15}
                      />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="at-pickdrop-next-button"
                      disabled={
                        !formData.consent || submitting
                      }
                      style={{ opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {language === "hi" ? "दर्ज हो रहा है..." : "Submitting..."}
                        </>
                      ) : (
                        <>
                          {
                            text.navigation
                              .submit
                          }

                          <ArrowUpRight
                            size={15}
                          />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {submitError && (
                  <div style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "10px",
                    color: "#dc2626",
                    fontSize: "14px",
                    fontWeight: 500,
                    textAlign: "center"
                  }}>
                    {submitError}
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* =============================================
            AFTER BOOKING
        ============================================= */}

        <section className="at-pickdrop-after">
          <div className="at-pickdrop-shell">
            <div className="at-pickdrop-section-heading">
              <div>
                <span className="at-pickdrop-eyebrow">
                  {text.after.eyebrow}
                </span>

                <h2>
                  {text.after.titleLine1}
                  <br />

                  <span>
                    {text.after.titleLine2}
                  </span>
                </h2>
              </div>

              <p>
                {text.after.description}
              </p>
            </div>

            <div className="at-pickdrop-after__flow">
              {text.after.items.map(
                (item) => (
                  <article
                    key={item.number}
                  >
                    <span>
                      {item.number}
                    </span>

                    <strong>
                      {item.title}
                    </strong>

                    <p>
                      {item.text}
                    </p>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            PRIVACY
        ============================================= */}

        <section className="at-pickdrop-privacy">
          <div className="at-pickdrop-shell">
            <div className="at-pickdrop-privacy__box">
              <div className="at-pickdrop-privacy__heading">
                <span className="at-pickdrop-eyebrow">
                  {text.privacy.eyebrow}
                </span>

                <h2>
                  {text.privacy.title}
                </h2>
              </div>

              <div className="at-pickdrop-privacy__content">
                <div className="at-pickdrop-privacy__icon">
                  <LockKeyhole
                    size={25}
                  />
                </div>

                <h3>
                  {text.privacy.heading}
                </h3>

                <p>
                  {text.privacy.description}
                </p>

                <div className="at-pickdrop-privacy__points">
                  <span>
                    <Check size={13} />

                    {
                      text.privacy
                        .customerPrivacy
                    }
                  </span>

                  <span>
                    <Check size={13} />

                    {
                      text.privacy
                        .riderPrivacy
                    }
                  </span>

                  <span>
                    <Check size={13} />

                    {
                      text.privacy
                        .controlledUpdates
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================
            FINAL CTA
        ============================================= */}

        <section className="at-pickdrop-final">
          <div className="at-pickdrop-shell">
            <div className="at-pickdrop-final__box">
              <span>
                {text.final.eyebrow}
              </span>

              <h2>
                {text.final.title}
              </h2>

              <p>
                {text.final.description}
              </p>

              <div className="at-pickdrop-final__actions">
                <a
                  href="#book-pickup"
                  className="at-pickdrop-primary-button"
                >
                  {text.final.pickup}

                  <ArrowUpRight
                    size={16}
                  />
                </a>

                <Link
                  to="/contact"
                  className="at-pickdrop-final__secondary"
                >
                  <MessageCircle
                    size={15}
                  />

                  {text.final.contact}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PickDrop;