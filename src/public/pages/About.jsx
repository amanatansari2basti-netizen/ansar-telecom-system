import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Quote,
  ScanLine,
  ShieldCheck,
  Smartphone,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

import { Link } from "react-router-dom";

import PublicNavbar from "../components/PublicNavbar";
import { useLanguage } from "../context/LanguageContext";

import "../styles/about.css";

/* =========================================================
   ABOUT PAGE TRANSLATIONS
========================================================= */

const aboutContent = {
  en: {
    hero: {
      eyebrow: "ABOUT ANSAR TELECOM",
      titleLine1: "Repair built around",
      titleLine2: "responsibility.",
      description:
        "Ansar Telecom is a mobile repair service centre in Basti, Uttar Pradesh, focused on professional repair, responsible device handling and a more organised customer experience.",
      button: "Explore Services",

      panelLabel: "PROFESSIONAL MOBILE REPAIR",
      panelTitleLine1: "Better diagnosis.",
      panelTitleLine2: "Better process.",
      panelText:
        "From receiving a device to repair updates and final delivery, the focus is on keeping the service journey organised.",
    },

    story: {
      eyebrow: "01 / WHO WE ARE",
      titleLine1: "Mobile repair",
      titleLine2: "with a better process.",
      headingText:
        "Repair work is only one part of the experience. How a device is received, diagnosed, handled, updated and returned matters too.",

      brand: "ANSAR TELECOM",
      city: "Basti",
      location: "Uttar Pradesh · India",

      label: "OUR SERVICE PHILOSOPHY",
      title:
        "The device deserves proper attention. The customer deserves clarity.",

      paragraph1:
        "Mobile repair should begin with understanding the actual problem rather than rushing into a repair. Proper diagnosis helps the service process move in the right direction.",

      paragraph2:
        "Ansar Telecom also uses a structured repair workflow to keep jobs, repair stages and customer updates more organised.",

      points: [
        "Professional repair approach",
        "Structured device handling",
        "Clear customer communication",
        "Digital repair workflow",
      ],
    },

    owner: {
      sectionLabel: "02 / OWNER'S MESSAGE",
      ownerLabel: "OWNER",
      name: "Aqib Ansari",
      designation: "Owner · Ansar Telecom",

      quote:
        "At Ansar Telecom, our focus is to understand every device problem properly, handle each repair responsibly, and keep our customers informed throughout the service process.",

      message:
        "We are continuously working to make mobile repair more organised, transparent and convenient for our customers.",

      signature: "ANSAR TELECOM · BASTI",
    },

    approach: {
      eyebrow: "03 / OUR APPROACH",
      titleLine1: "What matters",
      titleLine2: "to us.",
      description:
        "A straightforward service experience built around proper diagnosis, responsible handling and useful customer information.",

      items: [
        {
          number: "01",
          title: "Proper Diagnosis",
          text:
            "Understanding the reported problem and inspecting the device before deciding the repair direction.",
        },
        {
          number: "02",
          title: "Responsible Handling",
          text:
            "Keeping device handling structured as it moves through the repair and service process.",
        },
        {
          number: "03",
          title: "Customer Focus",
          text:
            "Giving customers useful information about their repair instead of leaving them unsure about its status.",
        },
        {
          number: "04",
          title: "Local Service",
          text:
            "Professional mobile repair service based in Basti, Uttar Pradesh.",
        },
      ],
    },

    trust: {
      eyebrow: "DEVICE CARE",
      titleLine1: "Your phone is personal.",
      titleLine2: "We understand that.",

      heading:
        "Privacy-conscious repair handling.",

      paragraph1:
        "Personal photos, messages, accounts and files are treated as private. Device access should only be requested when it is reasonably needed for diagnosis, repair or testing.",

      paragraph2:
        "If a software procedure may erase device data, the customer should be informed before that procedure is carried out.",

      points: [
        "Customer privacy",
        "Responsible access",
        "Clear communication",
      ],
    },

    final: {
      eyebrow: "ANSAR TELECOM · BASTI",
      titleLine1: "Need help with",
      titleLine2: "your device?",

      description:
        "Explore our mobile repair services, book a doorstep pickup or contact Ansar Telecom to discuss your device problem.",

      services: "View Services",
      contact: "Contact Us",
    },

    footer: {
      brand: "ANSAR TELECOM",
      tagline: "Professional Mobile Repair",

      home: "Home",
      services: "Services",
      pickDrop: "Pick & Drop",
      track: "Track Repair",
      about: "About Us",
      contact: "Contact",

      location:
        "Basti · Uttar Pradesh · India",

      staffPortal: "Staff Portal",
    },
  },

  hi: {
    hero: {
      eyebrow: "ANSAR TELECOM के बारे में",
      titleLine1: "जिम्मेदारी के साथ",
      titleLine2: "मोबाइल रिपेयर।",

      description:
        "Ansar Telecom, Basti, Uttar Pradesh में एक मोबाइल रिपेयर सर्विस सेंटर है, जहां प्रोफेशनल रिपेयर, जिम्मेदारी से डिवाइस संभालने और ग्राहकों को बेहतर व व्यवस्थित सर्विस अनुभव देने पर ध्यान दिया जाता है।",

      button: "सर्विसेज देखें",

      panelLabel: "प्रोफेशनल मोबाइल रिपेयर",
      panelTitleLine1: "बेहतर जांच।",
      panelTitleLine2: "बेहतर प्रक्रिया।",

      panelText:
        "डिवाइस प्राप्त करने से लेकर रिपेयर अपडेट और अंतिम डिलीवरी तक, पूरी सर्विस प्रक्रिया को व्यवस्थित रखने पर ध्यान दिया जाता है।",
    },

    story: {
      eyebrow: "01 / हम कौन हैं",
      titleLine1: "मोबाइल रिपेयर",
      titleLine2: "एक बेहतर प्रक्रिया के साथ।",

      headingText:
        "सिर्फ फोन रिपेयर करना ही पूरी सर्विस नहीं है। डिवाइस कैसे लिया जाता है, उसकी जांच कैसे होती है, उसे कैसे संभाला जाता है, ग्राहक को अपडेट कैसे मिलता है और डिवाइस कैसे वापस दिया जाता है—ये सभी बातें महत्वपूर्ण हैं।",

      brand: "ANSAR TELECOM",
      city: "बस्ती",
      location: "उत्तर प्रदेश · भारत",

      label: "हमारी सर्विस सोच",

      title:
        "डिवाइस को सही ध्यान मिलना चाहिए और ग्राहक को साफ जानकारी।",

      paragraph1:
        "मोबाइल रिपेयर की शुरुआत सीधे काम शुरू करने के बजाय असली समस्या को समझने से होनी चाहिए। सही जांच से यह तय करने में मदद मिलती है कि डिवाइस के लिए उचित रिपेयर प्रक्रिया क्या होगी।",

      paragraph2:
        "Ansar Telecom में jobs, repair stages और customer updates को अधिक व्यवस्थित रखने के लिए structured repair workflow का भी उपयोग किया जाता है।",

      points: [
        "प्रोफेशनल रिपेयर प्रक्रिया",
        "व्यवस्थित डिवाइस हैंडलिंग",
        "ग्राहक से स्पष्ट जानकारी साझा करना",
        "डिजिटल रिपेयर वर्कफ्लो",
      ],
    },

    owner: {
      sectionLabel: "02 / मालिक का संदेश",
      ownerLabel: "मालिक",
      name: "Aqib Ansari",
      designation: "Owner · Ansar Telecom",

      quote:
        "Ansar Telecom में हमारा उद्देश्य हर डिवाइस की समस्या को सही तरीके से समझना, हर रिपेयर को जिम्मेदारी से संभालना और पूरी सर्विस प्रक्रिया के दौरान अपने ग्राहकों को आवश्यक जानकारी देते रहना है।",

      message:
        "हम मोबाइल रिपेयर सर्विस को अपने ग्राहकों के लिए अधिक व्यवस्थित, पारदर्शी और सुविधाजनक बनाने के लिए लगातार काम कर रहे हैं।",

      signature: "ANSAR TELECOM · BASTI",
    },

    approach: {
      eyebrow: "03 / हमारा तरीका",
      titleLine1: "हमारे लिए क्या",
      titleLine2: "महत्वपूर्ण है।",

      description:
        "एक सीधा और व्यवस्थित सर्विस अनुभव, जिसमें सही जांच, जिम्मेदारी से डिवाइस हैंडलिंग और ग्राहक को उपयोगी जानकारी देने पर ध्यान दिया जाता है।",

      items: [
        {
          number: "01",
          title: "सही जांच",
          text:
            "रिपेयर का तरीका तय करने से पहले ग्राहक द्वारा बताई गई समस्या को समझना और डिवाइस की जांच करना।",
        },
        {
          number: "02",
          title: "जिम्मेदारी से हैंडलिंग",
          text:
            "डिवाइस को रिपेयर और सर्विस प्रक्रिया के हर चरण में व्यवस्थित और जिम्मेदारी से संभालना।",
        },
        {
          number: "03",
          title: "ग्राहक पर ध्यान",
          text:
            "ग्राहक को उसकी रिपेयर से जुड़ी उपयोगी जानकारी देना, ताकि वह अपने डिवाइस की स्थिति को लेकर अनजान न रहे।",
        },
        {
          number: "04",
          title: "स्थानीय सर्विस",
          text:
            "Basti, Uttar Pradesh में प्रोफेशनल मोबाइल रिपेयर सर्विस।",
        },
      ],
    },

    trust: {
      eyebrow: "डिवाइस की सुरक्षा",
      titleLine1: "आपका फोन निजी है।",
      titleLine2: "हम यह समझते हैं।",

      heading:
        "प्राइवेसी को ध्यान में रखकर रिपेयर हैंडलिंग।",

      paragraph1:
        "आपकी निजी photos, messages, accounts और files को private माना जाता है। डिवाइस का access केवल तभी मांगा जाना चाहिए जब diagnosis, repair या testing के लिए उसकी उचित आवश्यकता हो।",

      paragraph2:
        "अगर किसी software procedure से डिवाइस का data मिटने की संभावना हो, तो वह प्रक्रिया शुरू करने से पहले ग्राहक को इसकी जानकारी दी जानी चाहिए।",

      points: [
        "ग्राहक की प्राइवेसी",
        "जिम्मेदारी से डिवाइस एक्सेस",
        "स्पष्ट जानकारी",
      ],
    },

    final: {
      eyebrow: "ANSAR TELECOM · BASTI",
      titleLine1: "अपने डिवाइस के लिए",
      titleLine2: "मदद चाहिए?",

      description:
        "हमारी मोबाइल रिपेयर सर्विसेज देखें, घर से पिकअप बुक करें या अपने डिवाइस की समस्या के बारे में बात करने के लिए Ansar Telecom से संपर्क करें।",

      services: "सर्विसेज देखें",
      contact: "संपर्क करें",
    },

    footer: {
      brand: "ANSAR TELECOM",
      tagline: "प्रोफेशनल मोबाइल रिपेयर",

      home: "होम",
      services: "सर्विसेज",
      pickDrop: "पिक एंड ड्रॉप",
      track: "रिपेयर ट्रैक करें",
      about: "हमारे बारे में",
      contact: "संपर्क",

      location:
        "बस्ती · उत्तर प्रदेश · भारत",

      staffPortal: "स्टाफ पोर्टल",
    },
  },
};

/* =========================================================
   ABOUT PAGE
========================================================= */

function About() {
  const { language } = useLanguage();

  const text =
    aboutContent[language] ||
    aboutContent.en;

  const approachIcons = [
    ScanLine,
    ShieldCheck,
    Users,
    MapPin,
  ];

  return (
    <div className="at-about-page">
      <PublicNavbar />

      <main>
        {/* =================================================
            HERO
        ================================================= */}

        <section className="at-about-hero">
          <div className="at-about-shell">
            <div className="at-about-hero__grid">
              <div className="at-about-hero__heading">
                <span className="at-about-eyebrow">
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

              <div className="at-about-hero__copy">
                <p>
                  {text.hero.description}
                </p>

                <Link
                  to="/services"
                  className="at-about-primary-button"
                >
                  {text.hero.button}

                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="at-about-hero__panel">
              <div className="at-about-hero__panel-copy">
                <span>
                  {text.hero.panelLabel}
                </span>

                <h2>
                  {text.hero.panelTitleLine1}
                  <br />
                  {text.hero.panelTitleLine2}
                </h2>

                <p>
                  {text.hero.panelText}
                </p>
              </div>

              <div className="at-about-hero__visual">
                <div className="at-about-hero__visual-circle">
                  <Smartphone
                    size={54}
                    strokeWidth={1.15}
                  />
                </div>

                <div className="at-about-hero__visual-line">
                  <span />

                  <Wrench size={21} />

                  <span />
                </div>

                <div className="at-about-hero__visual-circle at-about-hero__visual-circle--yellow">
                  <CheckCircle2
                    size={54}
                    strokeWidth={1.15}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            WHO WE ARE
        ================================================= */}

        <section className="at-about-story">
          <div className="at-about-shell">
            <div className="at-about-section-heading">
              <div>
                <span className="at-about-eyebrow">
                  {text.story.eyebrow}
                </span>

                <h2>
                  {text.story.titleLine1}
                  <br />

                  <span>
                    {text.story.titleLine2}
                  </span>
                </h2>
              </div>

              <p>
                {text.story.headingText}
              </p>
            </div>

            <div className="at-about-story__grid">
              <div className="at-about-story__visual">
                <div className="at-about-story__mark">
                  <span>AT</span>
                </div>

                <div className="at-about-story__visual-copy">
                  <span>
                    {text.story.brand}
                  </span>

                  <strong>
                    {text.story.city}
                  </strong>

                  <p>
                    {text.story.location}
                  </p>
                </div>

                <div className="at-about-story__tool">
                  <Wrench
                    size={36}
                    strokeWidth={1.15}
                  />
                </div>
              </div>

              <div className="at-about-story__content">
                <span className="at-about-story__label">
                  {text.story.label}
                </span>

                <h3>
                  {text.story.title}
                </h3>

                <p>
                  {text.story.paragraph1}
                </p>

                <p>
                  {text.story.paragraph2}
                </p>

                <div className="at-about-story__points">
                  {text.story.points.map(
                    (point) => (
                      <div key={point}>
                        <Check size={13} />

                        <span>
                          {point}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            OWNER MESSAGE
        ================================================= */}

        <section className="at-about-owner">
          <div className="at-about-shell">
            <div className="at-about-owner__box">
              <div className="at-about-owner__identity">
                <span className="at-about-owner__section-label">
                  {text.owner.sectionLabel}
                </span>

                <div className="at-about-owner__portrait">
                  <div className="at-about-owner__portrait-ring">
                    <UserRound
                      size={54}
                      strokeWidth={1.1}
                    />
                  </div>

                  <span>
                    {text.owner.ownerLabel}
                  </span>
                </div>

                <div className="at-about-owner__name">
                  <h3>
                    {text.owner.name}
                  </h3>

                  <p>
                    {text.owner.designation}
                  </p>
                </div>
              </div>

              <div className="at-about-owner__message">
                <div className="at-about-owner__quote">
                  <Quote
                    size={32}
                    strokeWidth={1.25}
                  />
                </div>

                <blockquote>
                  “{text.owner.quote}”
                </blockquote>

                <p>
                  {text.owner.message}
                </p>

                <div className="at-about-owner__signature">
                  <span />

                  <div>
                    <strong>
                      {text.owner.name}
                    </strong>

                    <small>
                      {text.owner.signature}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            APPROACH
        ================================================= */}

        <section className="at-about-approach">
          <div className="at-about-shell">
            <div className="at-about-section-heading">
              <div>
                <span className="at-about-eyebrow">
                  {text.approach.eyebrow}
                </span>

                <h2>
                  {text.approach.titleLine1}
                  <br />

                  <span>
                    {text.approach.titleLine2}
                  </span>
                </h2>
              </div>

              <p>
                {text.approach.description}
              </p>
            </div>

            <div className="at-about-approach__grid">
              {text.approach.items.map(
                (item, index) => {
                  const Icon =
                    approachIcons[index];

                  return (
                    <article
                      key={item.number}
                    >
                      <div className="at-about-approach__top">
                        <span>
                          {item.number}
                        </span>

                        <div>
                          <Icon
                            size={24}
                            strokeWidth={1.6}
                          />
                        </div>
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

        {/* =================================================
            DEVICE PRIVACY
        ================================================= */}

        <section className="at-about-trust">
          <div className="at-about-shell">
            <div className="at-about-trust__box">
              <div className="at-about-trust__heading">
                <span className="at-about-eyebrow">
                  {text.trust.eyebrow}
                </span>

                <h2>
                  {text.trust.titleLine1}
                  <br />

                  <span>
                    {text.trust.titleLine2}
                  </span>
                </h2>
              </div>

              <div className="at-about-trust__content">
                <div className="at-about-trust__icon">
                  <ShieldCheck
                    size={27}
                  />
                </div>

                <h3>
                  {text.trust.heading}
                </h3>

                <p>
                  {text.trust.paragraph1}
                </p>

                <p>
                  {text.trust.paragraph2}
                </p>

                <div className="at-about-trust__points">
                  {text.trust.points.map(
                    (point) => (
                      <span key={point}>
                        <Check size={13} />
                        {point}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FINAL CTA
        ================================================= */}

        <section className="at-about-final">
          <div className="at-about-shell">
            <div className="at-about-final__box">
              <span>
                {text.final.eyebrow}
              </span>

              <h2>
                {text.final.titleLine1}
                <br />
                {text.final.titleLine2}
              </h2>

              <p>
                {text.final.description}
              </p>

              <div className="at-about-final__actions">
                <Link
                  to="/services"
                  className="at-about-primary-button"
                >
                  {text.final.services}

                  <ArrowUpRight size={16} />
                </Link>

                <Link
                  to="/contact"
                  className="at-about-final__secondary"
                >
                  <MessageCircle size={15} />

                  {text.final.contact}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="at-about-footer">
        <div className="at-about-shell">
          <div className="at-about-footer__top">
            <div className="at-about-footer__brand">
              <div className="at-about-footer__brand-mark">
                <Smartphone size={19} />
              </div>

              <div>
                <strong>
                  {text.footer.brand}
                </strong>

                <span>
                  {text.footer.tagline}
                </span>
              </div>
            </div>

            <div className="at-about-footer__links">
              <Link to="/">
                {text.footer.home}
              </Link>

              <Link to="/services">
                {text.footer.services}
              </Link>

              <Link to="/pick-drop">
                {text.footer.pickDrop}
              </Link>

              <Link to="/track">
                {text.footer.track}
              </Link>

              <Link to="/about">
                {text.footer.about}
              </Link>

              <Link to="/contact">
                {text.footer.contact}
              </Link>
            </div>
          </div>

          <div className="at-about-footer__line" />

          <div className="at-about-footer__bottom">
            <span>
              ©{" "}
              {new Date().getFullYear()}{" "}
              Ansar Telecom
            </span>

            <span>
              {text.footer.location}
            </span>

            <Link to="/login">
              {text.footer.staffPortal}

              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default About;