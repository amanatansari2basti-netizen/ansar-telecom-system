import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Boxes,
  Check,
  Cpu,
  Fingerprint,
  Info,
  Layers3,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

import PublicNavbar from "../components/PublicNavbar";

import {
  getLocalizedService,
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
    notFound:
      "SERVICE NOT FOUND",
    notFoundTitle:
      "We could not find that service.",
    back:
      "Back to Services",

    all:
      "All Services",

    upcoming:
      "Upcoming Service",

    book:
      "Book Pick & Drop",

    updates:
      "Ask for Updates",

    contact:
      "Contact Us",

    photo:
      "SERVICE PHOTO",

    photoText:
      "Real Ansar Telecom repair photo will be added here",

    upcomingTitle:
      "This service is upcoming.",

    upcomingDescription:
      "It is shown so customers can understand what Ansar Telecom plans to introduce, but it should not yet be considered a regular available repair service.",

    about:
      "01 / ABOUT THIS SERVICE",

    aboutTitle:
      "What does this",
    aboutAccent:
      "service mean?",

    diagnosisNote:
      "The actual repair method is selected after checking the device, model and condition. A website description cannot replace physical diagnosis.",

    signs:
      "02 / COMMON SIGNS",

    signsTitle:
      "You may need this service",
    signsAccent:
      "if you notice these problems.",

    process:
      "03 / REPAIR PROCESS",

    processTitle:
      "How your device",
    processAccent:
      "is handled.",

    step: "STEP",

    safety:
      "04 / DEVICE SAFETY",

    safetyTitle:
      "Care around the",
    safetyAccent:
      "repair itself.",

    privacy:
      "CUSTOMER PRIVACY",

    privacyTitle:
      "Your personal data stays personal.",

    privacyBottom:
      "Privacy-conscious repair handling",

    important:
      "IMPORTANT BEFORE REPAIR",

    realWork:
      "05 / REAL REPAIR WORK",

    realWorkTitle:
      "See the process,",
    realWorkAccent:
      "not just the promise.",

    before:
      "BEFORE / DURING",

    mainPhoto:
      "Main service photograph",

    repairProcess:
      "REPAIR PROCESS",

    processPhoto:
      "Tool & process photo",

    completed:
      "COMPLETED WORK",

    afterPhoto:
      "After-repair photo",

    related:
      "RELATED SERVICES",

    relatedTitle:
      "You may also need these.",

    viewAll:
      "View all services",

    view:
      "View service",

    need:
      "NEED THIS REPAIR?",

    interested:
      "INTERESTED IN THIS UPCOMING SERVICE?",

    tell:
      "Tell us about your device.",

    availability:
      "Contact us for availability updates.",

    finalText:
      "Share the phone model and problem. The repair can then be assessed according to the actual device condition.",

    contactAnsar:
      "Contact Ansar Telecom",
  },

  hi: {
    notFound:
      "SERVICE नहीं मिली",

    notFoundTitle:
      "यह service हमें नहीं मिली।",

    back:
      "Services पर वापस जाएं",

    all:
      "सभी सेवाएं",

    upcoming:
      "जल्द उपलब्ध सेवा",

    book:
      "पिक एंड ड्रॉप बुक करें",

    updates:
      "अपडेट के लिए पूछें",

    contact:
      "संपर्क करें",

    photo:
      "SERVICE PHOTO",

    photoText:
      "यहाँ Ansar Telecom की असली repair photo जोड़ी जाएगी",

    upcomingTitle:
      "यह service जल्द उपलब्ध होगी।",

    upcomingDescription:
      "इसे इसलिए दिखाया गया है ताकि customers समझ सकें कि Ansar Telecom आगे कौन सी service शुरू करने की योजना बना रहा है। अभी इसे regular available repair service नहीं माना जाना चाहिए।",

    about:
      "01 / इस सेवा के बारे में",

    aboutTitle:
      "यह service",
    aboutAccent:
      "क्या करती है?",

    diagnosisNote:
      "Actual repair method device, model और उसकी condition check करने के बाद चुना जाता है। Website पर दी गई जानकारी physical diagnosis की जगह नहीं ले सकती।",

    signs:
      "02 / सामान्य संकेत",

    signsTitle:
      "इन समस्याओं में आपको",
    signsAccent:
      "इस service की जरूरत हो सकती है।",

    process:
      "03 / रिपेयर प्रक्रिया",

    processTitle:
      "आपके device को",
    processAccent:
      "कैसे handle किया जाता है।",

    step:
      "चरण",

    safety:
      "04 / डिवाइस सुरक्षा",

    safetyTitle:
      "Repair के दौरान",
    safetyAccent:
      "device की देखभाल।",

    privacy:
      "ग्राहक की प्राइवेसी",

    privacyTitle:
      "आपका personal data आपका ही रहता है।",

    privacyBottom:
      "Privacy-conscious repair handling",

    important:
      "रिपेयर से पहले जरूरी जानकारी",

    realWork:
      "05 / असली रिपेयर कार्य",

    realWorkTitle:
      "सिर्फ वादा नहीं,",
    realWorkAccent:
      "repair process भी देखें।",

    before:
      "पहले / रिपेयर के दौरान",

    mainPhoto:
      "Main service photograph",

    repairProcess:
      "रिपेयर प्रक्रिया",

    processPhoto:
      "Tools और process की photo",

    completed:
      "पूरा किया गया काम",

    afterPhoto:
      "Repair के बाद की photo",

    related:
      "संबंधित सेवाएं",

    relatedTitle:
      "आपको इन services की भी जरूरत हो सकती है।",

    viewAll:
      "सभी services देखें",

    view:
      "Service देखें",

    need:
      "यह रिपेयर चाहिए?",

    interested:
      "इस upcoming service में interested हैं?",

    tell:
      "हमें अपने device के बारे में बताइए।",

    availability:
      "Availability update के लिए संपर्क करें।",

    finalText:
      "Phone model और problem share करें। उसके बाद actual device condition के अनुसार repair का assessment किया जा सकता है।",

    contactAnsar:
      "Ansar Telecom से संपर्क करें",
  },
};

function ServiceDetails() {
  const { serviceSlug } =
    useParams();

  const { language } =
    useLanguage();

  const text =
    pageText[language] ||
    pageText.en;

  const service =
    getLocalizedService(
      serviceSlug,
      language
    );

  const allServices =
    getLocalizedServices(
      language
    );

  if (!service) {
    return (
      <div className="at-services-page">
        <PublicNavbar />

        <main className="at-service-not-found">
          <div>
            <span>
              {text.notFound}
            </span>

            <h1>
              {
                text.notFoundTitle
              }
            </h1>

            <Link
              to="/services"
              className="at-services-primary-button"
            >
              <ArrowLeft
                size={16}
              />

              {text.back}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const Icon =
    iconMap[service.icon] ||
    Smartphone;

  const relatedServices =
    allServices
      .filter(
        (item) =>
          item.slug !==
            service.slug &&
          item.available ===
            service.available
      )
      .slice(0, 3);

  return (
    <div className="at-services-page">
      <PublicNavbar />

      <main>
        <section className="at-detail-hero">
          <div className="at-services-shell">
            <Link
              to="/services"
              className="at-detail-back"
            >
              <ArrowLeft
                size={14}
              />

              {text.all}
            </Link>

            <div className="at-detail-hero__content">
                <div className="at-detail-hero__meta">
                  <span>
                    {
                      service.category
                    }
                  </span>

                  <span
                    className={
                      service.available
                        ? "is-available"
                        : "is-upcoming"
                    }
                  >
                    {service.available
                      ? service.badge
                      : text.upcoming}
                  </span>
                </div>

                <div className="at-detail-hero__icon">
                  <Icon
                    size={28}
                    strokeWidth={
                      1.6
                    }
                  />
                </div>

                <h1>
                  {service.title}
                </h1>

                <p>
                  {service.summary}
                </p>

                <div className="at-detail-hero__actions">
                  {service.available ? (
                    <Link
                      to="/pick-drop"
                      className="at-services-primary-button"
                    >
                      {text.book}

                      <ArrowUpRight
                        size={16}
                      />
                    </Link>
                  ) : (
                    <Link
                      to="/contact"
                      className="at-services-primary-button"
                    >
                      {text.updates}

                      <ArrowUpRight
                        size={16}
                      />
                    </Link>
                  )}

                  <Link
                    to="/contact"
                    className="at-detail-outline-button"
                  >
                    {text.contact}
                  </Link>
                </div>
              </div>
          </div>
        </section>

        {!service.available && (
          <section className="at-detail-upcoming-notice">
            <div className="at-services-shell">
              <div>
                <Sparkles
                  size={20}
                />

                <p>
                  <strong>
                    {
                      text.upcomingTitle
                    }
                  </strong>{" "}
                  {
                    text.upcomingDescription
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="at-detail-about">
          <div className="at-services-shell">
            <div className="at-detail-two-column">
              <div className="at-detail-section-title">
                <span className="at-services-eyebrow">
                  {text.about}
                </span>

                <h2>
                  {
                    text.aboutTitle
                  }
                  <br />
                  <span>
                    {
                      text.aboutAccent
                    }
                  </span>
                </h2>
              </div>

              <div className="at-detail-rich-text">
                <p>
                  {service.intro}
                </p>

                <div className="at-detail-note">
                  <Info
                    size={18}
                  />

                  <p>
                    {
                      text.diagnosisNote
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="at-detail-problems">
          <div className="at-services-shell">
            <div className="at-detail-section-heading">
              <span className="at-services-eyebrow">
                {text.signs}
              </span>

              <h2>
                {
                  text.signsTitle
                }
                <br />
                <span>
                  {
                    text.signsAccent
                  }
                </span>
              </h2>
            </div>

            <div className="at-detail-problems__grid">
              {service.problems.map(
                (
                  problem,
                  index
                ) => (
                  <div
                    key={problem}
                    className="at-detail-problem"
                  >
                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <p>
                      {problem}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section className="at-detail-process">
          <div className="at-services-shell">
            <div className="at-detail-section-heading">
              <span className="at-services-eyebrow">
                {text.process}
              </span>

              <h2>
                {
                  text.processTitle
                }
                <br />
                <span>
                  {
                    text.processAccent
                  }
                </span>
              </h2>
            </div>

            <div className="at-detail-process__grid">
              {service.process.map(
                (
                  step,
                  index
                ) => (
                  <article
                    key={
                      step.title
                    }
                    className="at-detail-process-card"
                  >
                    <span>
                      {text.step}{" "}
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      {index ===
                      0 ? (
                        <ScanLine
                          size={22}
                        />
                      ) : index ===
                        service
                          .process
                          .length -
                          1 ? (
                        <Check
                          size={22}
                        />
                      ) : (
                        <Wrench
                          size={22}
                        />
                      )}
                    </div>

                    <h3>
                      {step.title}
                    </h3>

                    <p>
                      {step.text}
                    </p>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        <section className="at-detail-trust">
          <div className="at-services-shell">
            <div className="at-detail-trust__grid">
              <div className="at-detail-trust__main">
                <span className="at-services-eyebrow">
                  {text.safety}
                </span>

                <h2>
                  {
                    text.safetyTitle
                  }
                  <br />
                  <span>
                    {
                      text.safetyAccent
                    }
                  </span>
                </h2>

                <div className="at-detail-safety-list">
                  {service.safety.map(
                    (item) => (
                      <div
                        key={item}
                      >
                        <span>
                          <Check
                            size={
                              14
                            }
                          />
                        </span>

                        <p>
                          {item}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="at-detail-trust__privacy">
                <div className="at-detail-privacy-icon">
                  <LockKeyhole
                    size={25}
                    strokeWidth={
                      1.6
                    }
                  />
                </div>

                <span>
                  {text.privacy}
                </span>

                <h3>
                  {
                    text.privacyTitle
                  }
                </h3>

                <p>
                  {service.privacy}
                </p>

                <div className="at-detail-privacy-bottom">
                  <ShieldCheck
                    size={17}
                  />

                  <span>
                    {
                      text.privacyBottom
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="at-detail-important">
          <div className="at-services-shell">
            <div className="at-detail-important__box">
              <div>
                <Info
                  size={22}
                />
              </div>

              <span>
                {text.important}
              </span>

              <p>
                {
                  service.importantNote
                }
              </p>
            </div>
          </div>
        </section>

        {relatedServices.length >
          0 && (
          <section className="at-detail-related">
            <div className="at-services-shell">
              <div className="at-detail-related__top">
                <div>
                  <span className="at-services-eyebrow">
                    {text.related}
                  </span>

                  <h2>
                    {
                      text.relatedTitle
                    }
                  </h2>
                </div>

                <Link to="/services">
                  {text.viewAll}

                  <ArrowRight
                    size={15}
                  />
                </Link>
              </div>

              <div className="at-detail-related__grid">
                {relatedServices.map(
                  (item) => {
                    const RelatedIcon =
                      iconMap[
                        item.icon
                      ] ||
                      Smartphone;

                    return (
                      <Link
                        key={
                          item.slug
                        }
                        to={`/services/${item.slug}`}
                      >
                        <div>
                          <RelatedIcon
                            size={
                              21
                            }
                          />
                        </div>

                        <span>
                          {
                            item.category
                          }
                        </span>

                        <h3>
                          {
                            item.shortTitle
                          }
                        </h3>

                        <p>
                          {
                            item.summary
                          }
                        </p>

                        <strong>
                          {
                            text.view
                          }

                          <ArrowUpRight
                            size={
                              15
                            }
                          />
                        </strong>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}

        <section className="at-detail-final">
          <div className="at-services-shell">
            <div className="at-detail-final__box">
              <span>
                {service.available
                  ? text.need
                  : text.interested}
              </span>

              <h2>
                {service.available
                  ? text.tell
                  : text.availability}
              </h2>

              <p>
                {text.finalText}
              </p>

              <div className="at-detail-final__actions">
                {service.available && (
                  <Link
                    to="/pick-drop"
                    className="at-services-primary-button"
                  >
                    {text.book}

                    <ArrowUpRight
                      size={16}
                    />
                  </Link>
                )}

                <Link
                  to="/contact"
                  className="at-services-dark-button"
                >
                  {
                    text.contactAnsar
                  }
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ServiceDetails;