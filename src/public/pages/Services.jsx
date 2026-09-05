import { Link } from "react-router-dom";

import {
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Boxes,
  ChevronRight,
  CircleDot,
  Cpu,
  Fingerprint,
  Layers3,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

import PublicNavbar from "../components/PublicNavbar";

import {
  getLocalizedServices,
} from "../data/servicesData";

import {
  useLanguage,
} from "../context/LanguageContext";

import "../styles/services.css";

const iconMap = {
  display: Smartphone,
  motherboard: Cpu,
  specialist: Wrench,
  laser: Zap,
  backglass: Layers3,
  parts: Boxes,
  battery: BatteryCharging,
  software: ScanLine,
  faceid: Fingerprint,
};

const pageText = {
  en: {
    eyebrow:
      "SERVICES / ANSAR TELECOM",
    title: "Advanced mobile",
    titleAccent:
      "repair services.",
    heroText:
      "From precision display work and laser-assisted repairs to motherboard diagnosis, replacement parts and professional software service.",
    book:
      "Book Pick & Drop",

    professional:
      "PROFESSIONAL MOBILE REPAIR",
    panelTitle:
      "Not every fault needs the same repair.",
    panelText:
      "We start with the problem, inspect the device and choose the repair approach according to its actual condition.",

    handling:
      "Device-focused handling",
    handlingText:
      "Careful repair workflow",
    diagnosis:
      "Proper diagnosis",
    diagnosisText:
      "Repair based on the fault",
    communication:
      "Clear communication",
    communicationText:
      "Understand the service",

    available:
      "01 / AVAILABLE SERVICES",
    choose:
      "Choose the repair",
    chooseAccent:
      "you want to understand.",
    chooseText:
      "Open any service to see what the repair is, common symptoms, how the device is handled and important information before service.",
    viewComplete:
      "View complete service",

    work:
      "REAL REPAIR WORK",
    workPhoto:
      "Service photos will be added here",
    workTypes:
      "Laser · OCA · Motherboard · Display Repair",

    how:
      "02 / HOW WE WORK",
    deserves:
      "Your phone deserves",
    deservesAccent:
      "careful handling.",
    howText:
      "A professional repair is not just about replacing a part. It also includes understanding the fault, choosing the correct procedure and checking the device again after work is completed.",

    steps: [
      {
        title: "Inspect",
        text:
          "Understand the device condition and reported problem.",
      },
      {
        title: "Diagnose",
        text:
          "Identify a suitable repair approach before major work.",
      },
      {
        title: "Repair",
        text:
          "Carry out the required work using appropriate tools and handling.",
      },
      {
        title: "Test",
        text:
          "Check the repaired function and device condition before delivery.",
      },
    ],

    privacy:
      "DEVICE PRIVACY",
    privacyTitle:
      "Repair the phone.",
    privacyAccent:
      "Respect the data.",
    privacyText:
      "Personal photos, messages, accounts and files should not be accessed simply because a phone is being repaired. Where device access is reasonably needed for diagnosis or functional testing, it should be limited to that purpose.",
    privacyLink:
      "Ask about your repair",

    upcoming:
      "03 / UPCOMING",
    upcomingTitle:
      "More specialist",
    upcomingAccent:
      "services are coming.",
    upcomingText:
      "These services are being prepared and are clearly marked as upcoming until they are officially available.",
    upcomingBadge:
      "UPCOMING SERVICE",
    learn:
      "Learn more",

    unsure:
      "NOT SURE WHICH SERVICE?",
    unsureTitle:
      "Tell us what is",
    unsureAccent:
      "wrong with your phone.",
    unsureText:
      "You do not need to know the technical name of the fault. Share the problem and the device can be inspected first.",
    contact:
      "Contact Us",
  },

  hi: {
    eyebrow:
      "सेवाएं / ANSAR TELECOM",
    title:
      "एडवांस मोबाइल",
    titleAccent:
      "रिपेयर सेवाएं।",
    heroText:
      "Precision display work और laser-assisted repair से लेकर motherboard diagnosis, replacement parts और professional software service तक।",
    book:
      "पिक एंड ड्रॉप बुक करें",

    professional:
      "प्रोफेशनल मोबाइल रिपेयर",
    panelTitle:
      "हर खराबी के लिए एक जैसा रिपेयर नहीं होता।",
    panelText:
      "हम पहले समस्या समझते हैं, डिवाइस की जांच करते हैं और उसकी वास्तविक स्थिति के अनुसार उपयुक्त repair approach चुनते हैं।",

    handling:
      "डिवाइस पर केंद्रित हैंडलिंग",
    handlingText:
      "सावधानीपूर्वक repair workflow",
    diagnosis:
      "सही जांच",
    diagnosisText:
      "Fault के अनुसार repair",
    communication:
      "स्पष्ट जानकारी",
    communicationText:
      "Service को ठीक से समझें",

    available:
      "01 / उपलब्ध सेवाएं",
    choose:
      "अपनी जरूरत की",
    chooseAccent:
      "रिपेयर सेवा समझें।",
    chooseText:
      "किसी भी service को खोलकर उसकी common problems, repair process, device handling और service से पहले जरूरी जानकारी देखें।",
    viewComplete:
      "पूरी सेवा देखें",

    work:
      "असली रिपेयर कार्य",
    workPhoto:
      "यहाँ service की असली photos जोड़ी जाएंगी",
    workTypes:
      "Laser · OCA · Motherboard · Display Repair",

    how:
      "02 / हम कैसे काम करते हैं",
    deserves:
      "आपका फोन चाहता है",
    deservesAccent:
      "सावधानीपूर्ण हैंडलिंग।",
    howText:
      "Professional repair केवल part बदलना नहीं है। इसमें fault को समझना, सही procedure चुनना और काम पूरा होने के बाद device को दोबारा check करना भी शामिल है।",

    steps: [
      {
        title: "जांच",
        text:
          "Device की condition और बताई गई problem को समझना।",
      },
      {
        title: "Diagnosis",
        text:
          "Major work से पहले suitable repair approach identify करना।",
      },
      {
        title: "Repair",
        text:
          "उपयुक्त tools और handling के साथ required work करना।",
      },
      {
        title: "Testing",
        text:
          "Delivery से पहले repaired function और device condition check करना।",
      },
    ],

    privacy:
      "डिवाइस प्राइवेसी",
    privacyTitle:
      "फोन की रिपेयर।",
    privacyAccent:
      "डेटा का सम्मान।",
    privacyText:
      "सिर्फ फोन repair के लिए आया है इसलिए personal photos, messages, accounts या files को access नहीं किया जाना चाहिए। जहाँ diagnosis या functional testing के लिए device access उचित रूप से जरूरी हो, उसे केवल उसी purpose तक सीमित रखा जाना चाहिए।",
    privacyLink:
      "अपनी रिपेयर के बारे में पूछें",

    upcoming:
      "03 / जल्द उपलब्ध",
    upcomingTitle:
      "और specialist",
    upcomingAccent:
      "services आ रही हैं।",
    upcomingText:
      "इन services को तैयार किया जा रहा है और officially available होने तक इन्हें स्पष्ट रूप से upcoming दिखाया गया है।",
    upcomingBadge:
      "जल्द उपलब्ध सेवा",
    learn:
      "और जानें",

    unsure:
      "कौन सी SERVICE चाहिए समझ नहीं आ रहा?",
    unsureTitle:
      "हमें अपने फोन की",
    unsureAccent:
      "समस्या बताइए।",
    unsureText:
      "आपको fault का technical नाम जानने की जरूरत नहीं है। अपनी समस्या बताइए, पहले device की जांच की जा सकती है।",
    contact:
      "संपर्क करें",
  },
};

function Services() {
  const { language } =
    useLanguage();

  const text =
    pageText[language] ||
    pageText.en;

  const servicesData =
    getLocalizedServices(
      language
    );

  const liveServices =
    servicesData.filter(
      (service) =>
        service.available
    );

  const upcomingServices =
    servicesData.filter(
      (service) =>
        !service.available
    );

  return (
    <div className="at-services-page">
      <PublicNavbar />

      <main>
        <section className="at-services-hero">
          <div className="at-services-shell">
            <div className="at-services-hero__grid">
              <div className="at-services-hero__heading">
                <span className="at-services-eyebrow">
                  {text.eyebrow}
                </span>

                <h1>
                  {text.title}
                  <br />
                  <span>
                    {text.titleAccent}
                  </span>
                </h1>
              </div>

              <div className="at-services-hero__copy">
                <p>
                  {text.heroText}
                </p>

                <Link
                  to="/pick-drop"
                  className="at-services-primary-button"
                >
                  {text.book}
                  <ArrowUpRight
                    size={16}
                  />
                </Link>
              </div>
            </div>

            <div className="at-services-hero__panel">
              <div className="at-services-hero__panel-main">
                <span>
                  {text.professional}
                </span>

                <h2>
                  {text.panelTitle}
                </h2>

                <p>
                  {text.panelText}
                </p>
              </div>

              <div className="at-services-hero__panel-side">
                <div>
                  <ShieldCheck
                    size={21}
                  />

                  <span>
                    <strong>
                      {text.handling}
                    </strong>
                    {text.handlingText}
                  </span>
                </div>

                <div>
                  <ScanLine
                    size={21}
                  />

                  <span>
                    <strong>
                      {text.diagnosis}
                    </strong>
                    {text.diagnosisText}
                  </span>
                </div>

                <div>
                  <CircleDot
                    size={21}
                  />

                  <span>
                    <strong>
                      {text.communication}
                    </strong>
                    {text.communicationText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="at-services-list">
          <div className="at-services-shell">
            <div className="at-services-section-heading">
              <div>
                <span className="at-services-eyebrow">
                  {text.available}
                </span>

                <h2>
                  {text.choose}
                  <br />
                  <span>
                    {text.chooseAccent}
                  </span>
                </h2>
              </div>

              <p>
                {text.chooseText}
              </p>
            </div>

            <div className="at-services-grid">
              {liveServices.map(
                (
                  service,
                  index
                ) => {
                  const Icon =
                    iconMap[
                      service.icon
                    ] ||
                    Smartphone;

                  return (
                    <Link
                      key={
                        service.slug
                      }
                      to={`/services/${service.slug}`}
                      className="at-service-card"
                    >
                      <div className="at-service-card__top">
                        <span className="at-service-card__index">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="at-service-card__badge">
                          {
                            service.badge
                          }
                        </span>
                      </div>

                      <div className="at-service-card__icon">
                        <Icon
                          size={25}
                          strokeWidth={
                            1.65
                          }
                        />
                      </div>

                      <div className="at-service-card__content">
                        <span className="at-service-card__category">
                          {
                            service.category
                          }
                        </span>

                        <h3>
                          {
                            service.shortTitle
                          }
                        </h3>

                        <p>
                          {
                            service.summary
                          }
                        </p>
                      </div>

                      <div className="at-service-card__bottom">
                        <span>
                          {
                            text.viewComplete
                          }
                        </span>

                        <div>
                          <ArrowUpRight
                            size={
                              17
                            }
                          />
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        </section>

        <section className="at-services-work">
          <div className="at-services-shell">
            <div className="at-services-work__grid">
              <div className="at-services-work__visual">
                <div className="at-detail-photo-card">
                  <img
                    src="/images/repair-work.jpg"
                    alt="Ansar Telecom Repair Workbench - Motherboard & Hardware Precision Repair"
                    className="at-detail-photo-img"
                    referrerPolicy="no-referrer"
                  />
                  <div className="at-detail-photo-overlay">
                    <div className="at-detail-photo-badge">
                      <Wrench size={16} />
                      <span>{text.work}</span>
                    </div>
                    <div className="at-detail-photo-meta">
                      <strong>{text.workPhoto}</strong>
                      <span>{text.workTypes}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="at-services-work__content">
                <span className="at-services-eyebrow">
                  {text.how}
                </span>

                <h2>
                  {text.deserves}
                  <br />
                  <span>
                    {
                      text.deservesAccent
                    }
                  </span>
                </h2>

                <p>
                  {text.howText}
                </p>

                <div className="at-services-work__steps">
                  {text.steps.map(
                    (
                      step,
                      index
                    ) => (
                      <article
                        key={
                          step.title
                        }
                      >
                        <span>
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <div>
                          <h3>
                            {
                              step.title
                            }
                          </h3>

                          <p>
                            {
                              step.text
                            }
                          </p>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="at-services-privacy">
          <div className="at-services-shell">
            <div className="at-services-privacy__box">
              <div>
                <span className="at-services-eyebrow">
                  {text.privacy}
                </span>

                <h2>
                  {
                    text.privacyTitle
                  }
                  <br />
                  {
                    text.privacyAccent
                  }
                </h2>
              </div>

              <div className="at-services-privacy__content">
                <ShieldCheck
                  size={28}
                />

                <p>
                  {text.privacyText}
                </p>

                <Link to="/contact">
                  {text.privacyLink}
                  <ArrowRight
                    size={15}
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="at-services-upcoming">
          <div className="at-services-shell">
            <div className="at-services-section-heading">
              <div>
                <span className="at-services-eyebrow">
                  {text.upcoming}
                </span>

                <h2>
                  {
                    text.upcomingTitle
                  }
                  <br />
                  <span>
                    {
                      text.upcomingAccent
                    }
                  </span>
                </h2>
              </div>

              <p>
                {text.upcomingText}
              </p>
            </div>

            <div className="at-upcoming-grid">
              {upcomingServices.map(
                (service) => {
                  const Icon =
                    iconMap[
                      service.icon
                    ] ||
                    Sparkles;

                  return (
                    <Link
                      key={
                        service.slug
                      }
                      to={`/services/${service.slug}`}
                      className="at-upcoming-card"
                    >
                      <div className="at-upcoming-card__icon">
                        <Icon
                          size={22}
                          strokeWidth={
                            1.6
                          }
                        />
                      </div>

                      <span>
                        {
                          text.upcomingBadge
                        }
                      </span>

                      <h3>
                        {
                          service.shortTitle
                        }
                      </h3>

                      <p>
                        {
                          service.summary
                        }
                      </p>

                      <div className="at-upcoming-card__link">
                        {text.learn}
                        <ChevronRight
                          size={15}
                        />
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        </section>

        <section className="at-services-final">
          <div className="at-services-shell">
            <div className="at-services-final__box">
              <span>
                {text.unsure}
              </span>

              <h2>
                {text.unsureTitle}
                <br />
                {text.unsureAccent}
              </h2>

              <p>
                {text.unsureText}
              </p>

              <div className="at-services-final__actions">
                <Link
                  to="/pick-drop"
                  className="at-services-primary-button"
                >
                  {text.book}
                  <ArrowUpRight
                    size={16}
                  />
                </Link>

                <Link
                  to="/contact"
                  className="at-services-dark-button"
                >
                  {text.contact}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Services;