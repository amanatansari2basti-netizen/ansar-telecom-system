import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wrench,
} from "lucide-react";

import PublicNavbar from "../components/PublicNavbar";
import { useLanguage } from "../context/LanguageContext";

import "../styles/contact.css";

const SHOP_PHONE = "9415172051";
const OWNER_PHONE = "9450576786";
const MAP_URL = "https://maps.app.goo.gl/gX9MVTHfYf33yiss6";
const INSTAGRAM_URL = "https://www.instagram.com/ansar_telecom/";

const contactContent = {
  en: {
    hero: {
      home: "Home",
      status: "ANSAR TELECOM / BASTI",
      eyebrow: "CONTACT ANSAR TELECOM",
      title1: "Your repair",
      title2: "starts here.",
      description: "Need help with your phone? Call Ansar Telecom or visit our shop in Basti for device inspection, repair enquiries and professional mobile service.",
      call: "Call Ansar Telecom",
      directions: "Get Directions",
      visualLabel: "VISIT · CALL · CONNECT",
      visualTitle1: "Find the shop.",
      visualTitle2: "Talk to us.",
      visualLocation: "District Hospital Road · Basti · Uttar Pradesh",
      city: "Basti",
      statePin: "Uttar Pradesh · 272002",
      metaLocation: "LOCATION",
      metaLocationValue: "Basti, Uttar Pradesh",
      pin: "PIN CODE",
      contact: "PRIMARY CONTACT",
      instagram: "INSTAGRAM",
    },
    connect: {
      eyebrow: "01 / CONNECT",
      title1: "Choose how",
      title2: "you reach us.",
      description: "Call the shop for general repair enquiries, contact the owner when required, follow our work online or navigate directly to the shop.",
    },
    cards: [
      {
        id: "01",
        label: "SHOP CONTACT",
        title: "+91 94151 72051",
        description: "Primary contact number for repair enquiries, service information and general shop assistance.",
        actionLabel: "Call Shop",
        icon: Phone,
        type: "shop",
      },
      {
        id: "02",
        label: "OWNER / DIRECT CONTACT",
        title: "Aqib Ansari",
        value: "+91 94505 76786",
        description: "Direct owner contact for important enquiries and assistance related to Ansar Telecom.",
        actionLabel: "Call Owner",
        icon: UserRound,
        type: "owner",
      },
      {
        id: "03",
        label: "INSTAGRAM",
        title: "@ansar_telecom",
        description: "Follow Ansar Telecom for repair work, workshop updates, service highlights and future announcements.",
        actionLabel: "Open Instagram",
        icon: Camera,
        type: "instagram",
      },
      {
        id: "04",
        label: "LOCATION",
        title: "Basti, Uttar Pradesh",
        description: "Beside Sulaxmi Tower, in front of Ganna Office, District Hospital Road, Basti – 272002.",
        actionLabel: "Get Directions",
        icon: Navigation,
        type: "map",
      },
    ],
    location: {
      section: "02 / VISIT THE SHOP",
      destination: "DESTINATION",
      road: "District Hospital Road",
      openMaps: "Open Google Maps",
      eyebrow: "SHOP LOCATION",
      title1: "Find us",
      title2: "in Basti.",
      business: "ANSAR TELECOM",
      address: "Beside Sulaxmi Tower,\nIn Front of Ganna Office,\nDistrict Hospital Road,\nBasti, Uttar Pradesh – 272002",
      landmarkLabel: "LANDMARK",
      landmark: "Beside Sulaxmi Tower · In front of Ganna Office",
      googleMaps: "GOOGLE MAPS",
      directions: "Get Directions",
    },
    visit: {
      eyebrow: "03 / REPAIR VISIT",
      title1: "Bring the problem.",
      title2: "We inspect the device.",
      description: "You do not need to diagnose the phone yourself. Explain the symptoms you are seeing and the device can be inspected before the appropriate repair process is decided.",
      points: [
        {
          icon: Wrench,
          title: "Bring the device",
          description: "Visit with the device and explain the problem you are experiencing.",
        },
        {
          icon: Smartphone,
          title: "Device inspection",
          description: "The device condition and reported fault can be checked before the repair path is decided.",
        },
        {
          icon: ShieldCheck,
          title: "Controlled handling",
          description: "Repair work is approached according to the device, fault and technical requirement.",
        },
      ],
    },
    direct: {
      eyebrow: "04 / DIRECT CONTACT",
      title1: "Talk to",
      title2: "Ansar Telecom.",
      description: "For most repair enquiries, call the main shop number. For an important matter that requires direct owner assistance, Aqib Ansari can also be contacted separately.",
      shopContact: "Direct shop contact",
      assistance: "Repair assistance",
      directory: "CONTACT DIRECTORY",
      directoryTitle: "Reach the right contact.",
      shop: "ANSAR TELECOM / SHOP",
      primaryEnquiries: "Primary repair enquiries",
      owner: "OWNER",
      instagram: "INSTAGRAM",
      instagramText: "Repair work & updates",
    },
    tracking: {
      eyebrow: "ALREADY LEFT YOUR DEVICE?",
      title1: "Follow your",
      title2: "repair journey.",
      description: "If your repair has a tracking Job ID, use the customer tracking page to check available repair progress information.",
      button: "Track My Repair",
    },
    final: {
      eyebrow: "ANSAR TELECOM · BASTI",
      title1: "Visit.",
      title2: "Diagnose.",
      title3: "Repair.",
      description: "Contact Ansar Telecom for your mobile repair enquiry or navigate directly to the shop in Basti.",
      call: "Call Shop",
      maps: "Open Google Maps",
      address: "District Hospital Road · Basti · Uttar Pradesh · 272002",
    },
  },
  hi: {
    hero: {
      home: "होम",
      status: "ANSAR TELECOM / BASTI",
      eyebrow: "ANSAR TELECOM से संपर्क करें",
      title1: "आपकी रिपेयर",
      title2: "यहां से शुरू होती है।",
      description: "अपने फोन के लिए मदद चाहिए? डिवाइस की जांच, रिपेयर से जुड़ी जानकारी और प्रोफेशनल मोबाइल सर्विस के लिए Ansar Telecom को कॉल करें या Basti में हमारी दुकान पर आएं।",
      call: "Ansar Telecom को कॉल करें",
      directions: "दिशा देखें",
      visualLabel: "आएं · कॉल करें · जुड़ें",
      visualTitle1: "दुकान तक पहुंचें।",
      visualTitle2: "हमसे बात करें।",
      visualLocation: "District Hospital Road · Basti · Uttar Pradesh",
      city: "बस्ती",
      statePin: "उत्तर प्रदेश · 272002",
      metaLocation: "स्थान",
      metaLocationValue: "बस्ती, उत्तर प्रदेश",
      pin: "पिन कोड",
      contact: "मुख्य संपर्क",
      instagram: "INSTAGRAM",
    },
    connect: {
      eyebrow: "01 / संपर्क",
      title1: "हमसे अपनी सुविधा के",
      title2: "अनुसार संपर्क करें।",
      description: "सामान्य रिपेयर जानकारी के लिए दुकान पर कॉल करें, जरूरत होने पर सीधे owner से संपर्क करें, हमारा काम Instagram पर देखें या Google Maps से सीधे दुकान तक पहुंचें।",
    },
    cards: [
      {
        id: "01",
        label: "दुकान का संपर्क",
        title: "+91 94151 72051",
        description: "रिपेयर से जुड़ी जानकारी, सर्विस पूछताछ और सामान्य सहायता के लिए मुख्य संपर्क नंबर।",
        actionLabel: "दुकान पर कॉल करें",
        icon: Phone,
        type: "shop",
      },
      {
        id: "02",
        label: "OWNER / सीधा संपर्क",
        title: "Aqib Ansari",
        value: "+91 94505 76786",
        description: "महत्वपूर्ण पूछताछ और Ansar Telecom से जुड़ी सहायता के लिए owner से सीधे संपर्क करें।",
        actionLabel: "Owner को कॉल करें",
        icon: UserRound,
        type: "owner",
      },
      {
        id: "03",
        label: "INSTAGRAM",
        title: "@ansar_telecom",
        description: "हमारे repair work, workshop updates, service highlights और आगे की announcements के लिए Ansar Telecom को Instagram पर follow करें।",
        actionLabel: "Instagram खोलें",
        icon: Camera,
        type: "instagram",
      },
      {
        id: "04",
        label: "दुकान का स्थान",
        title: "बस्ती, उत्तर प्रदेश",
        description: "Sulaxmi Tower के बगल में, Ganna Office के सामने, District Hospital Road, Basti – 272002.",
        actionLabel: "दिशा देखें",
        icon: Navigation,
        type: "map",
      },
    ],
    location: {
      section: "02 / दुकान पर आएं",
      destination: "गंतव्य",
      road: "District Hospital Road",
      openMaps: "Google Maps खोलें",
      eyebrow: "दुकान का स्थान",
      title1: "हमसे मिलें",
      title2: "Basti में।",
      business: "ANSAR TELECOM",
      address: "Sulaxmi Tower के बगल में,\nGanna Office के सामने,\nDistrict Hospital Road,\nBasti, Uttar Pradesh – 272002",
      landmarkLabel: "लैंडमार्क",
      landmark: "Sulaxmi Tower के बगल में · Ganna Office के सामने",
      googleMaps: "GOOGLE MAPS",
      directions: "दिशा देखें",
    },
    visit: {
      eyebrow: "03 / रिपेयर के लिए आएं",
      title1: "समस्या बताइए।",
      title2: "हम डिवाइस की जांच करेंगे।",
      description: "आपको फोन की समस्या का technical diagnosis खुद करने की जरूरत नहीं है। बस हमें बताएं कि फोन में क्या समस्या दिखाई दे रही है। सही repair process तय करने से पहले डिवाइस की जांच की जा सकती है।",
      points: [
        {
          icon: Wrench,
          title: "डिवाइस लेकर आएं",
          description: "अपने डिवाइस के साथ दुकान पर आएं और जो समस्या हो रही है उसके बारे में बताएं।",
        },
        {
          icon: Smartphone,
          title: "डिवाइस की जांच",
          description: "रिपेयर का तरीका तय करने से पहले डिवाइस की स्थिति और बताई गई समस्या की जांच की जा सकती है।",
        },
        {
          icon: ShieldCheck,
          title: "जिम्मेदारी से हैंडलिंग",
          description: "रिपेयर का काम डिवाइस, उसकी समस्या और technical requirement के अनुसार किया जाता है।",
        },
      ],
    },
    direct: {
      eyebrow: "04 / सीधा संपर्क",
      title1: "बात करें",
      title2: "Ansar Telecom से।",
      description: "अधिकतर रिपेयर पूछताछ के लिए मुख्य दुकान नंबर पर कॉल करें। अगर कोई महत्वपूर्ण विषय है जिसमें owner की सीधी सहायता चाहिए, तो Aqib Ansari से अलग से संपर्क किया जा सकता है।",
      shopContact: "दुकान से सीधा संपर्क",
      assistance: "रिपेयर सहायता",
      directory: "संपर्क डायरेक्टरी",
      directoryTitle: "सही व्यक्ति से संपर्क करें।",
      shop: "ANSAR TELECOM / SHOP",
      primaryEnquiries: "मुख्य रिपेयर पूछताछ",
      owner: "OWNER",
      instagram: "INSTAGRAM",
      instagramText: "Repair work और updates",
    },
    tracking: {
      eyebrow: "डिवाइस पहले ही जमा कर चुके हैं?",
      title1: "अपनी रिपेयर",
      title2: "की स्थिति देखें।",
      description: "अगर आपकी रिपेयर के लिए tracking Job ID मिला है, तो customer tracking page पर उपलब्ध repair progress की जानकारी देख सकते हैं।",
      button: "रिपेयर ट्रैक करें",
    },
    final: {
      eyebrow: "ANSAR TELECOM · BASTI",
      title1: "आइए।",
      title2: "जांच कराइए।",
      title3: "रिपेयर कराइए।",
      description: "मोबाइल रिपेयर से जुड़ी जानकारी के लिए Ansar Telecom से संपर्क करें या Google Maps की मदद से Basti में सीधे हमारी दुकान तक पहुंचें।",
      call: "दुकान पर कॉल करें",
      maps: "Google Maps खोलें",
      address: "District Hospital Road · Basti · Uttar Pradesh · 272002",
    },
  },
};

function getContactAction(type) {
  if (type === "shop") {
    return { action: `tel:+91${SHOP_PHONE}`, external: false };
  }
  if (type === "owner") {
    return { action: `tel:+91${OWNER_PHONE}`, external: false };
  }
  if (type === "instagram") {
    return { action: INSTAGRAM_URL, external: true };
  }
  return { action: MAP_URL, external: true };
}

function ContactCard({ item }) {
  const Icon = item.icon;
  const { action, external } = getContactAction(item.type);

  return (
    <article className="atc-contact-card">
      <div className="atc-contact-card__top">
        <span>{item.id}</span>
        <div className="atc-contact-card__icon">
          <Icon size={22} strokeWidth={1.5} />
        </div>
      </div>

      <div className="atc-contact-card__content">
        <span className="atc-contact-card__label">{item.label}</span>
        <h3>{item.title}</h3>
        {item.value && <strong className="atc-contact-card__value">{item.value}</strong>}
        <p>{item.description}</p>
      </div>

      <a href={action} className="atc-contact-card__action" target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        <span>{item.actionLabel}</span>
        {external ? <ExternalLink size={14} /> : <ArrowRight size={14} />}
      </a>
    </article>
  );
}

export default function Contact() {
  const { language } = useLanguage();
  const text = contactContent[language] || contactContent.en;

  return (
    <div className="atc-page">
      <PublicNavbar />

      <main>
        {/* HERO SECTION */}
        <section className="atc-hero">
          <div className="atc-shell">
            <div className="atc-hero__top">
              <Link to="/" className="atc-back">
                <ArrowLeft size={14} />
                {text.hero.home}
              </Link>
              <div className="atc-hero__status">
                <span />
                {text.hero.status}
              </div>
            </div>

            <div className="atc-hero__layout">
              <div className="atc-hero__heading">
                <span className="atc-eyebrow">{text.hero.eyebrow}</span>
                <h1>
                  {text.hero.title1}
                  <br />
                  <span>{text.hero.title2}</span>
                </h1>
              </div>

              <div className="atc-hero__copy">
                <p>{text.hero.description}</p>
                <div className="atc-hero__actions">
                  <a href={`tel:+91${SHOP_PHONE}`} className="atc-primary-button">
                    <Phone size={15} />
                    {text.hero.call}
                  </a>
                  <a href={MAP_URL} target="_blank" rel="noreferrer" className="atc-outline-button">
                    <Navigation size={15} />
                    {text.hero.directions}
                  </a>
                </div>
              </div>
            </div>

            <div className="atc-hero__visual">
              <div className="atc-hero__visual-copy">
                <span>{text.hero.visualLabel}</span>
                <h2>
                  {text.hero.visualTitle1}
                  <br />
                  {text.hero.visualTitle2}
                </h2>
                <p>{text.hero.visualLocation}</p>
              </div>

              <div className="atc-hero__location">
                <div className="atc-hero__location-ring">
                  <div className="atc-hero__location-pin">
                    <MapPin size={31} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="atc-hero__location-copy">
                  <span>ANSAR TELECOM</span>
                  <strong>{text.hero.city}</strong>
                  <small>{text.hero.statePin}</small>
                </div>
              </div>
            </div>

            <div className="atc-hero__meta">
              <div>
                <span>{text.hero.metaLocation}</span>
                <strong>{text.hero.metaLocationValue}</strong>
              </div>
              <i />
              <div>
                <span>{text.hero.pin}</span>
                <strong>272002</strong>
              </div>
              <i />
              <div>
                <span>{text.hero.contact}</span>
                <strong>94151 72051</strong>
              </div>
              <i />
              <div>
                <span>{text.hero.instagram}</span>
                <strong>@ansar_telecom</strong>
              </div>
            </div>
          </div>
        </section>

        {/* CONNECT SECTION */}
        <section className="atc-connect">
          <div className="atc-shell">
            <div className="atc-section-heading">
              <div>
                <span className="atc-eyebrow">{text.connect.eyebrow}</span>
                <h2>
                  {text.connect.title1}
                  <br />
                  <span>{text.connect.title2}</span>
                </h2>
              </div>
              <p>{text.connect.description}</p>
            </div>

            <div className="atc-contact-grid">
              {text.cards.map((item) => (
                <ContactCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* LOCATION SECTION - FIXED ADDRESS FONT SIZE */}
        <section className="atc-location">
          <div className="atc-shell">
            <div className="atc-location__grid">
              <div className="atc-location__visual">
                <div className="atc-location__visual-top">
                  <span>{text.location.section}</span>
                  <Navigation size={19} />
                </div>

                <div className="atc-location__map-art">
                  <span className="atc-map-line atc-map-line--one" />
                  <span className="atc-map-line atc-map-line--two" />
                  <span className="atc-map-line atc-map-line--three" />
                  <div className="atc-location__pin">
                    <MapPin size={27} />
                  </div>
                  <div className="atc-location__destination">
                    <small>{text.location.destination}</small>
                    <strong>Ansar Telecom</strong>
                    <span>{text.location.road}</span>
                  </div>
                </div>

                <a href={MAP_URL} target="_blank" rel="noreferrer" className="atc-location__map-button">
                  {text.location.openMaps}
                  <ExternalLink size={15} />
                </a>
              </div>

              <div className="atc-location__content">
                <span className="atc-eyebrow">{text.location.eyebrow}</span>
                <h2>
                  {text.location.title1}
                  <br />
                  <span>{text.location.title2}</span>
                </h2>

                <div className="atc-location__address">
                  <div className="atc-location__address-icon">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <span>{text.location.business}</span>
                    <address
                      className="atc-address-text"
                      style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        lineHeight: '1.65',
                        fontStyle: 'normal',
                        color: '#1a1a1a',
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {text.location.address.split("\n").map((line, index, array) => (
                        <span
                          key={`address-line-${index}`}
                          style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            display: 'block',
                            marginBottom: index < array.length - 1 ? '4px' : '0',
                          }}
                        >
                          {line}
                        </span>
                      ))}
                    </address>
                  </div>
                </div>

                <div className="atc-location__landmark">
                  <MapPin size={16} />
                  <div>
                    <span>{text.location.landmarkLabel}</span>
                    <strong style={{ fontSize: '15px', fontWeight: '600' }}>
                      {text.location.landmark}
                    </strong>
                  </div>
                </div>

                <a href={MAP_URL} target="_blank" rel="noreferrer" className="atc-location__direction">
                  <div>
                    <Navigation size={18} />
                    <span>
                      <small>{text.location.googleMaps}</small>
                      <strong>{text.location.directions}</strong>
                    </span>
                  </div>
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* VISIT SECTION */}
        <section className="atc-visit">
          <div className="atc-shell">
            <div className="atc-section-heading">
              <div>
                <span className="atc-eyebrow">{text.visit.eyebrow}</span>
                <h2>
                  {text.visit.title1}
                  <br />
                  <span>{text.visit.title2}</span>
                </h2>
              </div>
              <p>{text.visit.description}</p>
            </div>

            <div className="atc-visit__grid">
              {text.visit.points.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article className="atc-visit-card" key={`visit-point-${index}`}>
                    <div className="atc-visit-card__top">
                      <span>0{index + 1}</span>
                      <div>
                        <Icon size={23} strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="atc-visit-card__content">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* DIRECT CONTACT SECTION */}
        <section className="atc-direct">
          <div className="atc-shell">
            <div className="atc-direct__grid">
              <div className="atc-direct__copy">
                <span className="atc-eyebrow">{text.direct.eyebrow}</span>
                <h2>
                  {text.direct.title1}
                  <br />
                  <span>{text.direct.title2}</span>
                </h2>
                <p>{text.direct.description}</p>

                <div className="atc-direct__trust">
                  <span>
                    <CheckCircle2 size={14} />
                    {text.direct.shopContact}
                  </span>
                  <span>
                    <ShieldCheck size={14} />
                    {text.direct.assistance}
                  </span>
                </div>
              </div>

              <div className="atc-phone-panel">
                <div className="atc-phone-panel__heading">
                  <span>{text.direct.directory}</span>
                  <strong>{text.direct.directoryTitle}</strong>
                </div>

                <a href={`tel:+91${SHOP_PHONE}`} className="atc-phone-row atc-phone-row--primary">
                  <div className="atc-phone-row__icon">
                    <Phone size={19} />
                  </div>
                  <div className="atc-phone-row__content">
                    <span>{text.direct.shop}</span>
                    <strong>+91 94151 72051</strong>
                    <small>{text.direct.primaryEnquiries}</small>
                  </div>
                  <ArrowRight size={17} />
                </a>

                <a href={`tel:+91${OWNER_PHONE}`} className="atc-phone-row">
                  <div className="atc-phone-row__icon">
                    <UserRound size={19} />
                  </div>
                  <div className="atc-phone-row__content">
                    <span>{text.direct.owner}</span>
                    <strong>Aqib Ansari</strong>
                    <small>+91 94505 76786</small>
                  </div>
                  <ArrowRight size={17} />
                </a>

                <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="atc-phone-row">
                  <div className="atc-phone-row__icon">
                    <Camera size={19} />
                  </div>
                  <div className="atc-phone-row__content">
                    <span>{text.direct.instagram}</span>
                    <strong>@ansar_telecom</strong>
                    <small>{text.direct.instagramText}</small>
                  </div>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TRACKING SECTION */}
        <section className="atc-tracking">
          <div className="atc-shell">
            <div className="atc-tracking__inner">
              <div>
                <span>{text.tracking.eyebrow}</span>
                <h2>
                  {text.tracking.title1}
                  <br />
                  <em>{text.tracking.title2}</em>
                </h2>
              </div>
              <div className="atc-tracking__right">
                <p>{text.tracking.description}</p>
                <Link to="/track" className="atc-tracking__button">
                  {text.tracking.button}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="atc-final">
          <div className="atc-shell">
            <div className="atc-final__box">
              <span>{text.final.eyebrow}</span>
              <h2>
                {text.final.title1}
                <br />
                {text.final.title2}
                <br />
                {text.final.title3}
              </h2>
              <p>{text.final.description}</p>

              <div className="atc-final__actions">
                <a href={`tel:+91${SHOP_PHONE}`} className="atc-primary-button">
                  <Phone size={15} />
                  {text.final.call}
                </a>
                <a href={MAP_URL} target="_blank" rel="noreferrer" className="atc-outline-button">
                  <Navigation size={15} />
                  {text.final.maps}
                </a>
              </div>

              <div className="atc-final__address">
                <MapPin size={12} />
                {text.final.address}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}