import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Check,
  Cpu,
  MapPin,
  MessageCircle,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Star,
  Wrench,
  Zap,
} from "lucide-react";

import PublicNavbar from "../components/PublicNavbar";
import CinematicIntro from "../components/CinematicIntro";
import PickDropFlowAnimation from "../components/PickDropFlowAnimation";

import {
  useLanguage,
} from "../context/LanguageContext";

import "../styles/cinematic.css";

/* =========================================================
   GOOGLE MAPS
========================================================= */

const GOOGLE_MAPS_URL =
  "https://maps.app.goo.gl/gX9MVTHfYf33yiss6";

/* =========================================================
   HOME TRANSLATIONS
========================================================= */

const homeContent = {
  en: {
    hero: {
      label: "01 / MOBILE REPAIR",
      title: "Professional repair.",
      titleAccent: "Done properly.",
      description:
        "Mobile repair and device care in Basti with a structured service process, digital repair tracking and clear customer updates.",
      book: "Book Pick & Drop",
      track: "Track repair",

      photoBrand: "WORKSHOP PHOTO",
      photoTitle: "Add Workshop Photo",
      photoPrompt: "Click or drag & drop to upload your workshop photo",
      photoFormats: "Supports JPG, PNG, WebP",
      photoBtn: "Add Photo",
      photoChange: "Change Photo",
      photoRemove: "Remove",

      badgeTitle:
        "Professional Mobile Repair",
      badgeLocation:
        "Basti, Uttar Pradesh",

      strip: [
        "DISPLAY REPAIR",
        "BATTERY",
        "CHARGING",
        "BOARD REPAIR",
        "DEVICE CARE",
      ],
    },

    quick: {
      services: "Repair Services",
      pickup: "Pick & Drop",
      track: "Track Repair",
      contact: "Contact Us",
    },

    repair: {
      label: "02 / OUR SERVICE",
      title: "The right repair,",
      titleAccent: "the right way.",

      description:
        "From everyday smartphone problems to advanced hardware work, we focus on proper diagnosis, careful handling and an organised repair process.",

      button: "View all services",

      features: [
        {
          title: "Proper handling",
          text:
            "Device care throughout the repair process",
        },
        {
          title: "Digital tracking",
          text:
            "Check available repair status online",
        },
        {
          title: "Clear updates",
          text:
            "Better communication during service",
        },
      ],

      photoLabel: "REPAIR WORKSPACE",
      photoTitle:
        "Add technician repair photo",
      photoPath:
        "public/images/repair-work.jpg",
    },

    services: {
      label: "03 / REPAIR SERVICES",

      title: "What we can",
      titleAccent: "help repair.",

      description:
        "Common mobile repair services available through Ansar Telecom.",

      view: "View service",

      items: [
        {
          title: "Display & Touch",
          text:
            "Display, touch and glass related mobile repair.",
        },
        {
          title: "Battery Service",
          text:
            "Battery diagnosis and replacement service.",
        },
        {
          title: "Charging & Power",
          text:
            "Charging, power and startup related problems.",
        },
        {
          title: "Board Repair",
          text:
            "Advanced hardware and motherboard diagnosis.",
        },
      ],
    },

    principles: {
      label: "WHAT MATTERS TO US",

      title: "Better service behind",
      titleSecond: "every repair.",

      items: [
        {
          title: "Careful handling",
          text:
            "Your device is handled through an organised repair workflow.",
        },
        {
          title: "Proper diagnosis",
          text:
            "Repair starts by understanding the actual device problem.",
        },
        {
          title: "Clear communication",
          text:
            "A simpler service experience with better customer updates.",
        },
      ],
    },

    customer: {
      photoLabel: "CUSTOMER SERVICE",

      photoTitle:
        "Pick & Drop + Repair Tracking",

      label:
        "04 / CUSTOMER EXPERIENCE",

      title: "Easier from",
      titleAccent:
        "pickup to delivery.",

      description:
        "Request Pick & Drop service, follow the repair process and access important service information through the website.",

      points: [
        "Request device pickup",
        "Track repair status",
        "Contact the service centre",
      ],

      book: "Book Pick & Drop",
      track: "Track Repair",
    },

    reviews: {
      label: "05 / CUSTOMER REVIEWS",

      title: "Trusted by",
      titleAccent: "our customers.",

      description:
        "Real experiences shared by customers who chose Ansar Telecom for mobile repair and service.",

      verifiedLabel:
        "CUSTOMER REVIEW",

      ratingLabel:
        "5 STAR REVIEW",

      mapsButton:
        "Open on Google Maps",

      mapsText:
        "See Ansar Telecom on Google Maps",

      reviews: [
        {
          name: "Arshil Khan",
          text:
            "Amazing experience at Ansar Telecom. The staff is very polite and helpful. They provide genuine products at reasonable prices and the service quality is excellent. Quick response, smooth dealing, and customer satisfaction is their top priority. Highly recommended for mobile accessories, repairs, and telecom services. Will definitely visit again! 😊",
        },
        {
          name: "Nitesh Rai",
          text:
            "This shop has a long-standing reputation, with over two decades of experience in mobile handset repairs. Recently, it has been relocated to its current address, continuing the legacy of trust and excellence. The repair work carried out here is consistently genuine and reliable. The owner is extremely hardworking and honest, which truly sets this shop apart. It is because of his dedication and integrity that this has become one of the best mobile repair shops in Eastern Uttar Pradesh. I have personally had several of my phones repaired here and have always been fully satisfied with the service. Highly recommended for quality, trust, and professionalism.",
        },
        {
          name:
            "JAi bala ji Studio",
          text:
            "I'm from Gorakhpur. I was searching for the best and trusted shop for a folder change, then I found Ansar Telecom. He is an amazing and polite person, and he knows how to treat customers. So, whoever came here to see the reviews, you can trust them. Their work is good and they provide the best quality.",
        },
      ],
    },

    final: {
      label: "READY WHEN YOU ARE",

      title: "Need your phone",
      titleSecond: "repaired?",

      description:
        "Visit Ansar Telecom in Basti or start your service enquiry online.",

      book: "Book Pick & Drop",
      contact: "Contact Us",
    },

    footer: {
      subtitle:
        "Mobile Repair · Basti",

      explore: "EXPLORE",
      customer: "CUSTOMER",

      home: "Home",
      services: "Services",
      about: "About",
      pickup: "Pick & Drop",
      track: "Track Repair",
      contact: "Contact",

      location:
        "Basti · Uttar Pradesh · India",

      staff: "Staff Login",
    },
  },

  /* =======================================================
     HINDI
  ======================================================= */

  hi: {
    hero: {
      label: "01 / मोबाइल रिपेयर",

      title: "प्रोफेशनल रिपेयर।",
      titleAccent:
        "सही तरीके से।",

      description:
        "बस्ती में मोबाइल रिपेयर और डिवाइस केयर की व्यवस्थित सेवा, डिजिटल रिपेयर ट्रैकिंग और ग्राहक को स्पष्ट अपडेट के साथ।",

      book:
        "पिक एंड ड्रॉप बुक करें",

      track:
        "रिपेयर ट्रैक करें",

      photoBrand: "वर्कशॉप फोटो",
      photoTitle: "वर्कशॉप फोटो जोड़ें",
      photoPrompt: "वर्कशॉप की फोटो अपलोड करने के लिए क्लिक करें या ड्रैग करें",
      photoFormats: "JPG, PNG, WebP सपोर्टेड",
      photoBtn: "फोटो जोड़ें",
      photoChange: "फोटो बदलें",
      photoRemove: "हटाएं",

      badgeTitle:
        "प्रोफेशनल मोबाइल रिपेयर",

      badgeLocation:
        "बस्ती, उत्तर प्रदेश",

      strip: [
        "डिस्प्ले रिपेयर",
        "बैटरी",
        "चार्जिंग",
        "बोर्ड रिपेयर",
        "डिवाइस केयर",
      ],
    },

    quick: {
      services:
        "रिपेयर सेवाएं",

      pickup:
        "पिक एंड ड्रॉप",

      track:
        "रिपेयर ट्रैक करें",

      contact:
        "संपर्क करें",
    },

    repair: {
      label:
        "02 / हमारी सेवा",

      title:
        "सही रिपेयर,",

      titleAccent:
        "सही तरीके से।",

      description:
        "रोज़मर्रा की स्मार्टफोन समस्याओं से लेकर एडवांस हार्डवेयर कार्य तक, हमारा ध्यान सही जांच, सावधानीपूर्वक हैंडलिंग और व्यवस्थित रिपेयर प्रक्रिया पर रहता है।",

      button:
        "सभी सेवाएं देखें",

      features: [
        {
          title:
            "सावधानीपूर्वक हैंडलिंग",

          text:
            "पूरी रिपेयर प्रक्रिया के दौरान डिवाइस की उचित देखभाल",
        },
        {
          title:
            "डिजिटल ट्रैकिंग",

          text:
            "ऑनलाइन उपलब्ध रिपेयर स्टेटस देखें",
        },
        {
          title:
            "स्पष्ट अपडेट",

          text:
            "सर्विस के दौरान बेहतर जानकारी और संपर्क",
        },
      ],

      photoLabel:
        "रिपेयर वर्कस्पेस",

      photoTitle:
        "यहाँ टेक्नीशियन की रिपेयर फोटो लगाएँ",

      photoPath:
        "public/images/repair-work.jpg",
    },

    services: {
      label:
        "03 / रिपेयर सेवाएं",

      title:
        "हम किन समस्याओं",

      titleAccent:
        "में मदद करते हैं।",

      description:
        "Ansar Telecom पर उपलब्ध प्रमुख मोबाइल रिपेयर सेवाएं।",

      view:
        "सेवा देखें",

      items: [
        {
          title:
            "डिस्प्ले और टच",

          text:
            "मोबाइल डिस्प्ले, टच और ग्लास से जुड़ी रिपेयर सेवा।",
        },
        {
          title:
            "बैटरी सर्विस",

          text:
            "बैटरी की जांच और आवश्यकता के अनुसार रिप्लेसमेंट सेवा।",
        },
        {
          title:
            "चार्जिंग और पावर",

          text:
            "चार्जिंग, पावर और फोन स्टार्ट होने से जुड़ी समस्याओं की जांच।",
        },
        {
          title:
            "बोर्ड रिपेयर",

          text:
            "एडवांस हार्डवेयर और मदरबोर्ड स्तर की जांच।",
        },
      ],
    },

    principles: {
      label:
        "हमारे लिए क्या महत्वपूर्ण है",

      title:
        "हर रिपेयर के पीछे",

      titleSecond:
        "बेहतर सेवा।",

      items: [
        {
          title:
            "सावधानी से हैंडलिंग",

          text:
            "आपके डिवाइस को एक व्यवस्थित रिपेयर प्रक्रिया के माध्यम से संभाला जाता है।",
        },
        {
          title:
            "सही जांच",

          text:
            "रिपेयर की शुरुआत डिवाइस की वास्तविक समस्या को समझने से होती है।",
        },
        {
          title:
            "स्पष्ट जानकारी",

          text:
            "बेहतर ग्राहक अपडेट के साथ आसान और स्पष्ट सर्विस अनुभव।",
        },
      ],
    },

    customer: {
      photoLabel:
        "कस्टमर सर्विस",

      photoTitle:
        "पिक एंड ड्रॉप + रिपेयर ट्रैकिंग",

      label:
        "04 / ग्राहक अनुभव",

      title:
        "पिकअप से",

      titleAccent:
        "डिलीवरी तक आसान।",

      description:
        "वेबसाइट से पिक एंड ड्रॉप रिक्वेस्ट करें, रिपेयर की प्रगति देखें और जरूरी सर्विस जानकारी प्राप्त करें।",

      points: [
        "डिवाइस पिकअप रिक्वेस्ट करें",
        "रिपेयर स्टेटस ट्रैक करें",
        "सर्विस सेंटर से संपर्क करें",
      ],

      book:
        "पिक एंड ड्रॉप बुक करें",

      track:
        "रिपेयर ट्रैक करें",
    },

    reviews: {
      label:
        "05 / ग्राहक समीक्षाएं",

      title:
        "हमारे ग्राहकों का",

      titleAccent:
        "भरोसा।",

      description:
        "मोबाइल रिपेयर और सर्विस के लिए Ansar Telecom चुनने वाले ग्राहकों द्वारा साझा किए गए वास्तविक अनुभव।",

      verifiedLabel:
        "ग्राहक समीक्षा",

      ratingLabel:
        "5 स्टार समीक्षा",

      mapsButton:
        "Google Maps पर देखें",

      mapsText:
        "Ansar Telecom को Google Maps पर देखें",

      reviews: [
        {
          name:
            "Arshil Khan",

          text:
            "Ansar Telecom पर बहुत अच्छा अनुभव रहा। स्टाफ बहुत विनम्र और मददगार है। यहाँ उचित कीमत पर अच्छे उत्पाद और बेहतरीन सर्विस मिलती है। तेज़ प्रतिक्रिया, आसान व्यवहार और ग्राहक संतुष्टि को प्राथमिकता दी जाती है। मोबाइल एक्सेसरीज़, रिपेयर और टेलीकॉम सेवाओं के लिए अत्यधिक अनुशंसित। मैं दोबारा जरूर आऊँगा! 😊",
        },
        {
          name:
            "Nitesh Rai",

          text:
            "इस दुकान की मोबाइल हैंडसेट रिपेयर में दो दशकों से अधिक अनुभव के साथ लंबे समय से प्रतिष्ठा रही है। हाल ही में दुकान को वर्तमान पते पर स्थानांतरित किया गया है और भरोसे व उत्कृष्टता की विरासत जारी है। यहाँ किया जाने वाला रिपेयर कार्य लगातार भरोसेमंद रहा है। मालिक बेहद मेहनती और ईमानदार हैं, जो इस दुकान को खास बनाता है। मैंने व्यक्तिगत रूप से अपने कई फोन यहाँ रिपेयर करवाए हैं और हर बार सर्विस से पूरी तरह संतुष्ट रहा हूँ। गुणवत्ता, भरोसे और प्रोफेशनल सर्विस के लिए अत्यधिक अनुशंसित।",
        },
        {
          name:
            "JAi bala ji Studio",

          text:
            "मैं गोरखपुर से हूँ। मैं फोल्डर बदलवाने के लिए एक अच्छी और भरोसेमंद दुकान खोज रहा था, तभी मुझे Ansar Telecom मिला। यहाँ का व्यवहार बहुत अच्छा और विनम्र है और ग्राहकों के साथ अच्छे तरीके से पेश आते हैं। जो भी यहाँ रिव्यू देखने आया है, वह इनके काम पर भरोसा कर सकता है। इनका काम अच्छा है और अच्छी क्वालिटी प्रदान करते हैं।",
        },
      ],
    },

    final: {
      label:
        "हम आपकी सेवा के लिए तैयार हैं",

      title:
        "फोन रिपेयर",

      titleSecond:
        "कराना है?",

      description:
        "बस्ती में Ansar Telecom पर आएँ या अपनी सर्विस रिक्वेस्ट ऑनलाइन शुरू करें।",

      book:
        "पिक एंड ड्रॉप बुक करें",

      contact:
        "संपर्क करें",
    },

    footer: {
      subtitle:
        "मोबाइल रिपेयर · बस्ती",

      explore:
        "जानकारी",

      customer:
        "ग्राहक",

      home:
        "होम",

      services:
        "सेवाएं",

      about:
        "हमारे बारे में",

      pickup:
        "पिक एंड ड्रॉप",

      track:
        "रिपेयर ट्रैक करें",

      contact:
        "संपर्क",

      location:
        "बस्ती · उत्तर प्रदेश · भारत",

      staff:
        "स्टाफ लॉगिन",
    },
  },
};

/* =========================================================
   SERVICE ICONS
========================================================= */

const serviceIcons = [
  Smartphone,
  BatteryCharging,
  Zap,
  Cpu,
];

const principleIcons = [
  ShieldCheck,
  Wrench,
  MessageCircle,
];

/* =========================================================
   HOME
========================================================= */

function PublicHome() {
  const { language } =
    useLanguage();

  const [repairImgError, setRepairImgError] =
    useState(false);

  const content = useMemo(
    () =>
      homeContent[language] ||
      homeContent.en,
    [language]
  );

  const [introVisible, setIntroVisible] =
    useState(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return true;
      }

      return (
        sessionStorage.getItem(
          "ansar-public-intro-seen"
        ) !== "true"
      );
    });

  useEffect(() => {
    if (!introVisible) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }
  }, [introVisible]);

  useEffect(() => {
    if (!introVisible) {
      document.body.style.overflow =
        "";

      return undefined;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [introVisible]);

  const handleIntroComplete = () => {
    setIntroVisible(false);

    sessionStorage.setItem(
      "ansar-public-intro-seen",
      "true"
    );

    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    });
  };

  return (
    <div className="at-site">
      {/* ===============================================
          LOCKED INTRO
      ================================================ */}

      {introVisible && (
        <CinematicIntro
          onComplete={
            handleIntroComplete
          }
        />
      )}

      <PublicNavbar />

      <main>
        {/* =============================================
            HERO
        ============================================== */}

        <section className="at-home-hero">
          <div className="at-home-shell">
            <div className="at-home-hero__top">
              <div className="at-home-hero__heading">
                <span className="at-home-label">
                  {content.hero.label}
                </span>

                <h1>
                  {content.hero.title}

                  <br />

                  <span>
                    {
                      content.hero
                        .titleAccent
                    }
                  </span>
                </h1>
              </div>

              <div className="at-home-hero__intro">
                <p>
                  {
                    content.hero
                      .description
                  }
                </p>

                <div className="at-home-hero__actions">
                  <Link
                    to="/pick-drop"
                    className="at-yellow-button"
                  >
                    {content.hero.book}

                    <ArrowUpRight
                      size={16}
                    />
                  </Link>

                  <Link
                    to="/track"
                    className="at-simple-link"
                  >
                    {content.hero.track}

                    <ArrowRight
                      size={15}
                    />
                  </Link>
                </div>
              </div>
            </div>

            <div className="at-home-hero__photo">
              <div className="at-custom-photo-wrapper">
                <img
                  src="/images/cracked-phone-repair.jpg"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/ansar-workshop.jpg";
                  }}
                  alt="Ansar Telecom Workshop"
                  className="at-home-hero__photo-img"
                />
              </div>

              <div className="at-home-hero__photo-badge">
                <span>
                  <ShieldCheck
                    size={16}
                  />
                </span>

                <div>
                  <strong>
                    {
                      content.hero
                        .badgeTitle
                    }
                  </strong>

                  <small>
                    {
                      content.hero
                        .badgeLocation
                    }
                  </small>
                </div>
              </div>
            </div>

            <div className="at-home-hero__strip">
              {content.hero.strip.map(
                (item, index) => (
                  <div
                    key={item}
                    style={{
                      display:
                        "contents",
                    }}
                  >
                    <span>
                      {item}
                    </span>

                    {index <
                      content.hero
                        .strip.length -
                        1 && <i />}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            QUICK LINKS
        ============================================== */}

        <section className="at-home-quick">
          <div className="at-home-shell">
            <div className="at-home-quick__grid">
              <Link to="/services">
                <div>
                  <Smartphone
                    size={19}
                  />

                  <span>
                    {
                      content.quick
                        .services
                    }
                  </span>
                </div>

                <ArrowUpRight
                  size={17}
                />
              </Link>

              <Link to="/pick-drop">
                <div>
                  <PackageCheck
                    size={19}
                  />

                  <span>
                    {
                      content.quick
                        .pickup
                    }
                  </span>
                </div>

                <ArrowUpRight
                  size={17}
                />
              </Link>

              <Link to="/track">
                <div>
                  <ScanLine size={19} />

                  <span>
                    {
                      content.quick
                        .track
                    }
                  </span>
                </div>

                <ArrowUpRight
                  size={17}
                />
              </Link>

              <Link to="/contact">
                <div>
                  <MessageCircle
                    size={19}
                  />

                  <span>
                    {
                      content.quick
                        .contact
                    }
                  </span>
                </div>

                <ArrowUpRight
                  size={17}
                />
              </Link>
            </div>
          </div>
        </section>

        {/* =============================================
            SERVICE INTRO
        ============================================== */}

        <section className="at-home-repair">
          <div className="at-home-shell">
            <div className="at-home-repair__grid">
              <div className="at-home-repair__copy">
                <span className="at-home-label">
                  {
                    content.repair
                      .label
                  }
                </span>

                <h2>
                  {
                    content.repair
                      .title
                  }

                  <br />

                  <span>
                    {
                      content.repair
                        .titleAccent
                    }
                  </span>
                </h2>

                <p>
                  {
                    content.repair
                      .description
                  }
                </p>

                <Link
                  to="/services"
                  className="at-outline-button"
                >
                  {
                    content.repair
                      .button
                  }

                  <ArrowUpRight
                    size={16}
                  />
                </Link>

                <div className="at-home-repair__features">
                  {content.repair.features.map(
                    (
                      feature,
                      index
                    ) => {
                      const icons = [
                        ShieldCheck,
                        ScanLine,
                        MessageCircle,
                      ];

                      const Icon =
                        icons[index];

                      return (
                        <div
                          key={
                            feature.title
                          }
                        >
                          <Icon
                            size={18}
                          />

                          <span>
                            <strong>
                              {
                                feature.title
                              }
                            </strong>

                            {
                              feature.text
                            }
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="at-home-repair__photo">
                {!repairImgError ? (
                  <img
                    src="/images/repair-work.jpg"
                    alt="Ansar Telecom technician repairing a phone"
                    className="at-home-repair__photo-img"
                    onError={() =>
                      setRepairImgError(true)
                    }
                  />
                ) : (
                <div className="at-photo-placeholder at-photo-placeholder--light">
                  <div className="at-photo-placeholder__icon">
                    <Smartphone
                      size={32}
                    />
                  </div>

                  <span>
                    {
                      content.repair
                        .photoLabel
                    }
                  </span>

                  <strong>
                    {
                      content.repair
                        .photoTitle
                    }
                  </strong>

                  <small>
                    {
                      content.repair
                        .photoPath
                    }
                  </small>
                </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =============================================
            SERVICES
        ============================================== */}

        <section className="at-home-services">
          <div className="at-home-shell">
            <div className="at-home-section-heading">
              <div>
                <span className="at-home-label">
                  {
                    content.services
                      .label
                  }
                </span>

                <h2>
                  {
                    content.services
                      .title
                  }

                  <br />

                  <span>
                    {
                      content.services
                        .titleAccent
                    }
                  </span>
                </h2>
              </div>

              <p>
                {
                  content.services
                    .description
                }
              </p>
            </div>

            <div className="at-home-services__grid">
              {content.services.items.map(
                (
                  service,
                  index
                ) => {
                  const Icon =
                    serviceIcons[index];

                  return (
                    <Link
                      to="/services"
                      className="at-home-service-card"
                      key={
                        service.title
                      }
                    >
                      <div className="at-home-service-card__number">
                        0{index + 1}
                      </div>

                      <div className="at-home-service-card__icon">
                        <Icon
                          size={23}
                          strokeWidth={
                            1.7
                          }
                        />
                      </div>

                      <div className="at-home-service-card__body">
                        <h3>
                          {
                            service.title
                          }
                        </h3>

                        <p>
                          {
                            service.text
                          }
                        </p>
                      </div>

                      <div className="at-home-service-card__bottom">
                        <span>
                          {
                            content
                              .services
                              .view
                          }
                        </span>

                        <ArrowUpRight
                          size={16}
                        />
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* =============================================
            PRINCIPLES
        ============================================== */}

        <section className="at-home-principles">
          <div className="at-home-shell">
            <div className="at-home-principles__box">
              <span className="at-home-label">
                {
                  content.principles
                    .label
                }
              </span>

              <h2>
                {
                  content.principles
                    .title
                }

                <br />

                {
                  content.principles
                    .titleSecond
                }
              </h2>

              <div className="at-home-principles__grid">
                {content.principles.items.map(
                  (
                    item,
                    index
                  ) => {
                    const Icon =
                      principleIcons[
                        index
                      ];

                    return (
                      <article
                        key={
                          item.title
                        }
                      >
                        <span>
                          0{index + 1}
                        </span>

                        <div>
                          <Icon
                            size={20}
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
          </div>
        </section>

        {/* =============================================
            CUSTOMER EXPERIENCE
        ============================================== */}

        <section className="at-home-customer">
          <div className="at-home-shell">
            <div className="at-home-customer__grid">
              <div className="at-home-customer__visual">
                <PickDropFlowAnimation language={language} />
              </div>

              <div className="at-home-customer__copy">
                <span className="at-home-label">
                  {
                    content.customer
                      .label
                  }
                </span>

                <h2>
                  {
                    content.customer
                      .title
                  }

                  <br />

                  <span>
                    {
                      content.customer
                        .titleAccent
                    }
                  </span>
                </h2>

                <p>
                  {
                    content.customer
                      .description
                  }
                </p>

                <div className="at-home-customer__list">
                  {content.customer.points.map(
                    (point) => (
                      <div key={point}>
                        <Check
                          size={15}
                        />

                        {point}
                      </div>
                    )
                  )}
                </div>

                <div className="at-home-customer__actions">
                  <Link
                    to="/pick-drop"
                    className="at-yellow-button"
                  >
                    {
                      content.customer
                        .book
                    }

                    <ArrowUpRight
                      size={16}
                    />
                  </Link>

                  <Link
                    to="/track"
                    className="at-outline-button"
                  >
                    {
                      content.customer
                        .track
                    }
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================
            CUSTOMER REVIEWS
        ============================================== */}

        <section className="at-home-reviews">
          <div className="at-home-shell">
            <div className="at-home-reviews__heading">
              <div>
                <span className="at-home-label">
                  {
                    content.reviews
                      .label
                  }
                </span>

                <h2>
                  {
                    content.reviews
                      .title
                  }

                  <br />

                  <span>
                    {
                      content.reviews
                        .titleAccent
                    }
                  </span>
                </h2>
              </div>

              <div className="at-home-reviews__heading-side">
                <p>
                  {
                    content.reviews
                      .description
                  }
                </p>

                <a
                  href={
                    GOOGLE_MAPS_URL
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="at-home-reviews__maps"
                >
                  <MapPin
                    size={16}
                  />

                  {
                    content.reviews
                      .mapsButton
                  }

                  <ArrowUpRight
                    size={15}
                  />
                </a>
              </div>
            </div>

            <div className="at-home-reviews__grid">
              {content.reviews.reviews.map(
                (
                  review,
                  index
                ) => (
                  <article
                    className={`at-home-review-card ${
                      index === 1
                        ? "at-home-review-card--featured"
                        : ""
                    }`}
                    key={
                      review.name
                    }
                  >
                    <div className="at-home-review-card__top">
                      <span>
                        0{index + 1}
                      </span>

                      <div className="at-home-review-card__stars">
                        {Array.from({
                          length: 5,
                        }).map(
                          (
                            _,
                            starIndex
                          ) => (
                            <Star
                              key={
                                starIndex
                              }
                              size={15}
                              fill="currentColor"
                              strokeWidth={
                                1.5
                              }
                            />
                          )
                        )}
                      </div>
                    </div>

                    <div className="at-home-review-card__meta">
                      {
                        content.reviews
                          .verifiedLabel
                      }
                    </div>

                    <blockquote>
                      “{review.text}”
                    </blockquote>

                    <div className="at-home-review-card__footer">
                      <div className="at-home-review-card__avatar">
                        {review.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {review.name}
                        </strong>

                        <span>
                          {
                            content
                              .reviews
                              .ratingLabel
                          }
                        </span>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>

            <div className="at-home-reviews__bottom">
              <div>
                <MapPin size={18} />

                <span>
                  {
                    content.reviews
                      .mapsText
                  }
                </span>
              </div>

              <a
                href={
                  GOOGLE_MAPS_URL
                }
                target="_blank"
                rel="noreferrer"
              >
                {
                  content.reviews
                    .mapsButton
                }

                <ArrowUpRight
                  size={16}
                />
              </a>
            </div>
          </div>
        </section>

        {/* =============================================
            FINAL CTA
        ============================================== */}

        <section className="at-home-final">
          <div className="at-home-shell">
            <div className="at-home-final__box">
              <div className="at-home-final__content">
                <span>
                  {
                    content.final
                      .label
                  }
                </span>

                <h2>
                  {
                    content.final
                      .title
                  }

                  <br />

                  {
                    content.final
                      .titleSecond
                  }
                </h2>

                <p>
                  {
                    content.final
                      .description
                  }
                </p>

                <div className="at-home-final__actions">
                  <Link
                    to="/pick-drop"
                    className="at-yellow-button"
                  >
                    {
                      content.final
                        .book
                    }

                    <ArrowUpRight
                      size={16}
                    />
                  </Link>

                  <Link
                    to="/contact"
                    className="at-dark-outline-button"
                  >
                    {
                      content.final
                        .contact
                    }
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===============================================
          FOOTER
      ================================================ */}

      <footer className="at-home-footer">
        <div className="at-home-shell">
          <div className="at-home-footer__top">
            <Link
              to="/"
              className="at-home-footer__brand"
            >
              <div>
                <Smartphone
                  size={20}
                />
              </div>

              <span>
                <strong>
                  ANSAR TELECOM
                </strong>

                <small>
                  {
                    content.footer
                      .subtitle
                  }
                </small>
              </span>
            </Link>

            <div className="at-home-footer__links">
              <div>
                <span>
                  {
                    content.footer
                      .explore
                  }
                </span>

                <Link to="/">
                  {
                    content.footer
                      .home
                  }
                </Link>

                <Link to="/services">
                  {
                    content.footer
                      .services
                  }
                </Link>

                <Link to="/about">
                  {
                    content.footer
                      .about
                  }
                </Link>
              </div>

              <div>
                <span>
                  {
                    content.footer
                      .customer
                  }
                </span>

                <Link to="/pick-drop">
                  {
                    content.footer
                      .pickup
                  }
                </Link>

                <Link to="/track">
                  {
                    content.footer
                      .track
                  }
                </Link>

                <Link to="/contact">
                  {
                    content.footer
                      .contact
                  }
                </Link>
              </div>
            </div>
          </div>

          <div className="at-home-footer__bottom">
            <span>
              ©{" "}
              {new Date().getFullYear()}{" "}
              Ansar Telecom
            </span>

            <span>
              {
                content.footer
                  .location
              }
            </span>

            <span className="at-home-footer__credits">
              Designed And Developed By A² Labs
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicHome;