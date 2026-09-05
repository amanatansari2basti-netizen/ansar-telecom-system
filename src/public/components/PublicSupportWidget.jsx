import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "../styles/publicSupportWidget.css";

const WHATSAPP_NUMBER = "919415172051";

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
    message: "Hello Ansar Telecom, I need help regarding mobile repair.",
  },
  hi: {
    whatsapp: "WhatsApp पर बात करें",
    message: "नमस्ते Ansar Telecom, मुझे मोबाइल रिपेयर के बारे में जानकारी चाहिए।",
  },
};

function PublicSupportWidget() {
  const location = useLocation();
  const { language } = useLanguage();
  const content = useMemo(
    () => supportContent[language] || supportContent.en,
    [language]
  );

  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") return location.pathname === "/";
    if (route === "/services")
      return (
        location.pathname === "/services" ||
        location.pathname.startsWith("/services/")
      );
    return location.pathname === route;
  });

  if (!isPublicRoute) return null;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    content.message
  )}`;

  return (
    <div className="at-support-floating">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="at-support-floating__item at-support-floating__item--whatsapp"
        aria-label={content.whatsapp}
      >
        <span className="at-support-floating__icon">
          <MessageCircle size={22} strokeWidth={2.2} />
        </span>
        <span className="at-support-floating__text">{content.whatsapp}</span>
      </a>
    </div>
  );
}

export default PublicSupportWidget;