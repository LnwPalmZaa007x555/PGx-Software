"use client";
import styles from "./page.module.css";
import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      className={`${styles.container} ${theme === "dark" ? styles.dark : ""}`}
    >
      <h1 className={styles.title}>
        {language === "en" ? "Settings" : "การตั้งค่า"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Customize your preferences"
          : "ปรับแต่งการตั้งค่าของคุณ"}
      </p>

      {/* Appearance */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {language === "en" ? "Appearance" : "การแสดงผล"}
        </h2>
        <button
          className={styles.button}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>
            {theme === "dark"
              ? language === "en"
                ? "Light Mode"
                : "โหมดสว่าง"
              : language === "en"
              ? "Dark Mode"
              : "โหมดมืด"}
          </span>
        </button>
      </div>

      {/* Language */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {language === "en" ? "Language" : "ภาษา"}
        </h2>
        <button className={styles.button} onClick={toggleLanguage}>
          <Globe size={18} />
          <span>
            {language === "en" ? "Switch to Thai" : "เปลี่ยนเป็นอังกฤษ"}
          </span>
        </button>
      </div>
    </div>
  );
}
