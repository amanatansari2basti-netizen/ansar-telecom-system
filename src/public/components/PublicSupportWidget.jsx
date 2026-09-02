import { useMemo, useState } from "react";
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  X,
  HeadphonesIcon
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "../styles/publicSupportWidget.css";

const WHATSAPP_NUMBER = "919415172051";
const WHATSAPP_MESSAGE = "Hello Ansar Telecom, I need help regarding mobile repair.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const publicRoutes = [
  "/",
  "/services",
  "/pick-drop",
  "/track",
  "/about",
  "/contact",
];

const supportContent = {
  en: {
    whatsapp: "Talk on WhatsApp",
    support: "Help & Support",
    title: "How can we help you today?",
    quickTitle: "QUICK LINKS",
    quickActions: {
      track: "Track My Repair",
      services: "Repair Services",
      pickup: "Book Pick & Drop",
      location: "Shop Location",
    },
    whatsappTitle: "WhatsApp Support",
    whatsappSubtitle: "Chat directly with Ansar Telecom",
  },
  hi: {
    whatsapp: "WhatsApp पर बात करें",
    support: "सहायता",
    title: "हम आपकी कैसे मदद करें?",
    quickTitle: "त्वरित लिंक",
    quickActions: {
      track: "मेरी रिपेयर ट्रैक करें",
      services: "रिपेयर सेवाएं",
      pickup: "पिक एंड ड्रॉप बुक करें",
      location: "दुकान का पता",
    },
    whatsappTitle: "WhatsApp सहायता",
    whatsappSubtitle: "Ansar Telecom से सीधे बात करें",
  },
};

function PublicSupportWidget() {
  const location = useLocation();
  const { language } = useLanguage();
  const content = useMemo(() => supportContent[language] || supportContent.en, [language]);
  const [isOpen, setIsOpen] = useState(false);

  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") return location.pathname === "/";
    if (route === "/services") return location.pathname === "/services" || location.pathname.startsWith("/services/");
    return location.pathname === route;
  });

  if (!isPublicRoute) return null;

  return (
    <>
      <div className="at-support-floating">
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="at-support-floating__item at-support-floating__item--whatsapp">
          <span className="at-support-floating__icon"><MessageCircle size={20} strokeWidth={2} /></span>
          <span className="at-support-floating__text">{content.whatsapp}</span>
        </a>

        <button type="button" className={`at-support-floating__item at-support-floating__item--ai ${isOpen ? "at-support-floating__item--active" : ""}`} onClick={() => setIsOpen(!isOpen)}>
          <span className="at-support-floating__icon">
            {isOpen ? <X size={20} strokeWidth={2} /> : <HeadphonesIcon size={20} strokeWidth={2} />}
          </span>
          <span className="at-support-floating__text">{content.support}</span>
        </button>
      </div>

      <div className={`at-support-chat ${isOpen ? "at-support-chat--open" : ""}`}>
        <div className="at-support-chat__header">
          <div className="at-support-chat__identity">
            <div className="at-support-chat__bot-icon"><HeadphonesIcon size={20} strokeWidth={1.8} /></div>
            <div>
              <span>ANSAR TELECOM</span>
              <strong>{content.support}</strong>
            </div>
          </div>
          <button type="button" onClick={() => setIsOpen(false)}><X size={18} /></button>
        </div>

        <div className="at-support-chat__body" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="at-support-chat__welcome" style={{ padding: '15px', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '5px' }}>{content.title}</h3>
          </div>

          <div className="at-support-chat__quick">
            <span>{content.quickTitle}</span>
            <Link to="/track" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><PackageCheck size={17} />{content.quickActions.track}</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/services" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={17} />{content.quickActions.services}</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/pick-drop" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><PackageCheck size={17} />{content.quickActions.pickup}</span>
              <ChevronRight size={16} />
            </Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', color: '#fff', textDecoration: 'none' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={17} />{content.quickActions.location}</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="at-support-chat__whatsapp" style={{ marginTop: '15px' }}>
            <MessageCircle size={18} />
            <span>
              <strong>{content.whatsappTitle}</strong>
              <small>{content.whatsappSubtitle}</small>
            </span>
            <ChevronRight size={17} />
          </a>
        </div>
      </div>
    </>
  );
}

export default PublicSupportWidget;