"use client";
import { createContext, useContext, useState, useEffect } from "react";

type Lang = "th" | "en";

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Lang>("en");

  useEffect(() => {
    const saved = (localStorage.getItem("lang") as Lang) || "en";
    setLanguage(saved);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "th" : "en";
    setLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
