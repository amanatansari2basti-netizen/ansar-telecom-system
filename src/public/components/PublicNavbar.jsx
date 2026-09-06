import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  NavLink,
} from "react-router-dom";

import {
  ArrowUpRight,
  Check,
  Languages,
  Menu,
  Smartphone,
  X,
} from "lucide-react";

import {
  useLanguage,
} from "../context/LanguageContext";

const navigationText = {
  en: {
    home: "Home",
    services: "Services",
    pickDrop: "Pick & Drop",
    track: "Track Repair",
    about: "About",
    contact: "Contact",
    staff: "Staff",
    staffLogin: "Staff Login",
    book: "Book Pick & Drop",
    menu: "MENU",
    language: "Language",
    english: "English",
    hindi: "हिंदी",
    location:
      "Basti · Uttar Pradesh",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  hi: {
    home: "होम",
    services: "सेवाएं",
    pickDrop: "पिक एंड ड्रॉप",
    track: "रिपेयर ट्रैक करें",
    about: "हमारे बारे में",
    contact: "संपर्क",
    staff: "स्टाफ",
    staffLogin: "स्टाफ लॉगिन",
    book: "पिक एंड ड्रॉप बुक करें",
    menu: "मेन्यू",
    language: "भाषा",
    english: "English",
    hindi: "हिंदी",
    location:
      "बस्ती · उत्तर प्रदेश",
    openMenu: "मेन्यू खोलें",
    closeMenu: "मेन्यू बंद करें",
  },
};

function PublicNavbar() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [
    languageOpen,
    setLanguageOpen,
  ] = useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  const {
    language,
    changeLanguage,
  } = useLanguage();

  const text =
    navigationText[language];

  useEffect(() => {
    const handleScroll = () => {
      const isPast = window.scrollY > 20;
      setScrolled((prev) => (prev !== isPast ? isPast : prev));
    };

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
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
  }, [menuOpen]);

  useEffect(() => {
    const closeDropdown = (
      event
    ) => {
      if (
        !event.target.closest(
          ".at-language"
        )
      ) {
        setLanguageOpen(false);
      }
    };

    document.addEventListener(
      "click",
      closeDropdown
    );

    return () => {
      document.removeEventListener(
        "click",
        closeDropdown
      );
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const selectLanguage = (
    nextLanguage
  ) => {
    changeLanguage(nextLanguage);

    setLanguageOpen(false);
  };

  const getNavClass = ({
    isActive,
  }) =>
    isActive
      ? "at-public-nav__link at-public-nav__link--active"
      : "at-public-nav__link";

  return (
    <>
      <header
        className={`at-public-nav ${
          scrolled
            ? "at-public-nav--scrolled"
            : ""
        }`}
      >
        <div className="at-public-nav__inner">
          <Link
            to="/"
            className="at-public-nav__brand"
            onClick={closeMenu}
          >
            <div className="at-public-nav__brand-icon">
              <Smartphone
                size={18}
                strokeWidth={2}
              />
            </div>

            <div className="at-public-nav__brand-copy">
              <strong>
                ANSAR TELECOM
              </strong>

              <span>
                MOBILE REPAIR
              </span>
            </div>
          </Link>

          <nav className="at-public-nav__links">
            <NavLink
              to="/"
              end
              className={
                getNavClass
              }
            >
              {text.home}
            </NavLink>

            <NavLink
              to="/services"
              className={
                getNavClass
              }
            >
              {text.services}
            </NavLink>

            <NavLink
              to="/pick-drop"
              className={
                getNavClass
              }
            >
              {text.pickDrop}
            </NavLink>

            <NavLink
              to="/track"
              className={
                getNavClass
              }
            >
              {text.track}
            </NavLink>

            <NavLink
              to="/about"
              className={
                getNavClass
              }
            >
              {text.about}
            </NavLink>

            <NavLink
              to="/contact"
              className={
                getNavClass
              }
            >
              {text.contact}
            </NavLink>
          </nav>

          <div className="at-public-nav__actions">
            {/* =========================
                LANGUAGE
            ========================== */}

            <div className="at-language">
              <button
                type="button"
                className="at-language__button"
                onClick={(
                  event
                ) => {
                  event.stopPropagation();

                  setLanguageOpen(
                    (current) =>
                      !current
                  );
                }}
                aria-expanded={
                  languageOpen
                }
                aria-label={
                  text.language
                }
              >
                <Languages
                  size={14}
                />

                <span>
                  {language === "en"
                    ? "EN"
                    : "हिंदी"}
                </span>
              </button>

              <div
                className={`at-language__dropdown ${
                  languageOpen
                    ? "at-language__dropdown--open"
                    : ""
                }`}
              >
                <span className="at-language__label">
                  {text.language}
                </span>

                <button
                  type="button"
                  className={
                    language === "en"
                      ? "at-language__option at-language__option--active"
                      : "at-language__option"
                  }
                  onClick={() =>
                    selectLanguage(
                      "en"
                    )
                  }
                >
                  <span>
                    <strong>
                      EN
                    </strong>

                    <small>
                      English
                    </small>
                  </span>

                  {language ===
                    "en" && (
                    <Check
                      size={14}
                    />
                  )}
                </button>

                <button
                  type="button"
                  className={
                    language === "hi"
                      ? "at-language__option at-language__option--active"
                      : "at-language__option"
                  }
                  onClick={() =>
                    selectLanguage(
                      "hi"
                    )
                  }
                >
                  <span>
                    <strong>
                      अ
                    </strong>

                    <small>
                      हिंदी
                    </small>
                  </span>

                  {language ===
                    "hi" && (
                    <Check
                      size={14}
                    />
                  )}
                </button>
              </div>
            </div>

            <Link
              to="/pick-drop"
              className="at-public-nav__cta"
            >
              {text.book}

              <ArrowUpRight
                size={14}
              />
            </Link>
          </div>

          <button
            type="button"
            className="at-public-nav__menu-button"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label={
              text.openMenu
            }
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ===================================================
          MOBILE MENU
      =================================================== */}

      <div
        className={`at-mobile-menu ${
          menuOpen
            ? "at-mobile-menu--open"
            : ""
        }`}
      >
        <div
          className="at-mobile-menu__backdrop"
          onClick={closeMenu}
        />

        <div className="at-mobile-menu__panel">
          <div className="at-mobile-menu__top">
            <Link
              to="/"
              className="at-mobile-menu__brand"
              onClick={closeMenu}
            >
              <Smartphone
                size={20}
              />

              <strong>
                ANSAR TELECOM
              </strong>
            </Link>

            <button
              type="button"
              onClick={closeMenu}
              aria-label={
                text.closeMenu
              }
            >
              <X size={21} />
            </button>
          </div>

          {/* =========================
              MOBILE LANGUAGE
          ========================== */}

          <div className="at-mobile-language">
            <div className="at-mobile-language__heading">
              <Languages
                size={14}
              />

              <span>
                {text.language}
              </span>
            </div>

            <div className="at-mobile-language__options">
              <button
                type="button"
                className={
                  language === "en"
                    ? "at-mobile-language__option at-mobile-language__option--active"
                    : "at-mobile-language__option"
                }
                onClick={() =>
                  selectLanguage(
                    "en"
                  )
                }
              >
                English

                {language ===
                  "en" && (
                  <Check
                    size={13}
                  />
                )}
              </button>

              <button
                type="button"
                className={
                  language === "hi"
                    ? "at-mobile-language__option at-mobile-language__option--active"
                    : "at-mobile-language__option"
                }
                onClick={() =>
                  selectLanguage(
                    "hi"
                  )
                }
              >
                हिंदी

                {language ===
                  "hi" && (
                  <Check
                    size={13}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="at-mobile-menu__label">
            {text.menu}
          </div>

          <nav className="at-mobile-menu__links">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
            >
              <span>01</span>

              {text.home}
            </NavLink>

            <NavLink
              to="/services"
              onClick={closeMenu}
            >
              <span>02</span>

              {text.services}
            </NavLink>

            <NavLink
              to="/pick-drop"
              onClick={closeMenu}
            >
              <span>03</span>

              {text.pickDrop}
            </NavLink>

            <NavLink
              to="/track"
              onClick={closeMenu}
            >
              <span>04</span>

              {text.track}
            </NavLink>

            <NavLink
              to="/about"
              onClick={closeMenu}
            >
              <span>05</span>

              {text.about}
            </NavLink>

            <NavLink
              to="/contact"
              onClick={closeMenu}
            >
              <span>06</span>

              {text.contact}
            </NavLink>
          </nav>

          <div className="at-mobile-menu__bottom">
            <Link
              to="/pick-drop"
              onClick={closeMenu}
              className="at-yellow-button"
            >
              {text.book}

              <ArrowUpRight
                size={16}
              />
            </Link>

            <span>
              {text.location}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default PublicNavbar;