import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LanguageContext =
  createContext(null);

const STORAGE_KEY =
  "ansar-telecom-language";

export function LanguageProvider({
  children,
}) {
  const [language, setLanguage] =
    useState(() => {
      const savedLanguage =
        localStorage.getItem(
          STORAGE_KEY
        );

      return savedLanguage === "hi"
        ? "hi"
        : "en";
    });

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      language
    );

    document.documentElement.lang =
      language === "hi"
        ? "hi"
        : "en";
  }, [language]);

  const changeLanguage = (
    nextLanguage
  ) => {
    if (
      nextLanguage !== "en" &&
      nextLanguage !== "hi"
    ) {
      return;
    }

    setLanguage(nextLanguage);
  };

  const toggleLanguage = () => {
    setLanguage((current) =>
      current === "en"
        ? "hi"
        : "en"
    );
  };

  const value = useMemo(
    () => ({
      language,
      isHindi:
        language === "hi",
      changeLanguage,
      toggleLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}