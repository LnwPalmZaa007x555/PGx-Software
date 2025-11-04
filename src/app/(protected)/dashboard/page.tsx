"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { fetchDashboard, type DashboardData } from "@/utils/dashboard";
import {
  Search,
  Plus,
  ScanLine,
  Bell,
  FileText,
  Activity,
  BarChart2,
} from "lucide-react";

export default function DashboardPage() {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [casesCount, setCasesCount] = useState<number | null>(null);
  const [tatData, setTatData] = useState([
    { name: "Pre-analytic", value: 0 },
    { name: "Analytic", value: 0 },
    { name: "Post-analytic", value: 0 },
  ]);
  const [kpiData, setKpiData] = useState([
    { label: "Rejection Rate", th: "อัตราการปฏิเสธสิ่งส่งตรวจ", value: "-" },
    { label: "Average TAT", th: "TAT เฉลี่ย", value: "-" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data: DashboardData = await fetchDashboard();
        if (!mounted) return;
        setCasesCount(data.casesCount);
        setTatData([
          { name: "Pre-analytic", value: data.tatTracking.preAnalytic },
          { name: "Analytic", value: data.tatTracking.analytic },
          { name: "Post-analytic", value: data.tatTracking.postAnalytic },
        ]);
        setKpiData([
          { label: "Rejection Rate", th: "อัตราการปฏิเสธสิ่งส่งตรวจ", value: `${data.kpiQuality.rejectionRate}%` },
          { label: "Average TAT", th: "TAT เฉลี่ย", value: `${data.kpiQuality.averageTatHours} ชม.` },
        ]);
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const notifications = [
    { th: " เคส CYP2C9 ของผู้ป่วย A001 รอแปลผล", en: " CYP2C9 case (A001) pending review" },
    { th: " เคส HLA-B*15:02 ของผู้ป่วย B004 เกินกำหนด TAT", en: " HLA-B*15:02 case (B004) exceeded TAT" },
  ];
  const articles = [
    {
      th: "แนวทาง CPIC 2024 สำหรับ CYP2D6 และยากลุ่ม Antidepressants",
      en: "CPIC 2024 update for CYP2D6 and antidepressants",
    },
    {
      th: "ฐานข้อมูล Warfarin ใหม่จาก Thai PharmGKB Network",
      en: "New Warfarin dataset published by Thai PharmGKB Network",
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <h1 className={styles.title}>
        {language === "en" ? "PGx Dashboard" : "ภาพรวมระบบ PGx"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Pharmacogenomics overview and workflow monitoring for hospital staff"
          : "ภาพรวมระบบเภสัชพันธุศาสตร์และการติดตามขั้นตอนการทำงาน"}
      </p>

      {/* Quick Access */}
      <div className={styles.quickAccess}>
        <Link href="/case/add" className={styles.actionBtn}>
            <Plus size={18} style={{ marginRight: 6 }} />
            {language === "en" ? "Add New Case" : "เพิ่มเคสใหม่"}
        </Link>
        <button className={styles.actionBtn}>
          <ScanLine size={18} />{" "}
          {language === "en" ? "Scan Request Form" : "สแกนใบสั่งตรวจ"}
        </button>

        <div className={styles.searchBox}>
          <Search size={18} color="#4CA771" />
          <input
            type="text"
            placeholder={
              language === "en"
                ? "Search patient (HN, Name, Barcode)"
                : "ค้นหาผู้ป่วย (HN, ชื่อ, Barcode)"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <BarChart2 color="#4CA771" />
          <h3>{language === "en" ? "Daily / Weekly Stats" : "สถิติการใช้งานรายวัน / สัปดาห์"}</h3>
          <p className={styles.statNumber}>
            {casesCount ?? (loading ? "…" : 0)} {language === "en" ? "Cases" : "เคส"}
          </p>
        </div>
        <div className={styles.statCard}>
          <Activity color="#f4b400" />
          <h3>{language === "en" ? "TAT Tracking" : "ติดตาม TAT"}</h3>
          {tatData.map((t, i) => (
            <p key={i}>
              {t.name}: <span>{t.value}</span>{" "}
              {language === "en" ? "case(s)" : "เคส"}
            </p>
          ))}
        </div>
        <div className={styles.statCard}>
          <Bell color="#e55353" />
          <h3>{language === "en" ? "KPI Quality" : "KPI คุณภาพ"}</h3>
          {kpiData.map((k, i) => (
            <p key={i}>
              {language === "en" ? k.label : k.th}:{" "}
              <span>{k.value}</span>
            </p>
          ))}
          {error && (
            <p style={{ color: "#e55353", marginTop: 8 }}>
              {language === "en" ? "Load failed:" : "โหลดไม่สำเร็จ:"} {error}
            </p>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Bell size={18} color="#4CA771" />
          <h2>{language === "en" ? "Notifications / Tasks" : "การแจ้งเตือน"}</h2>
        </div>
        <ul className={styles.list}>
          {notifications.map((n, i) => (
            <li key={i}>{language === "en" ? n.en : n.th}</li>
          ))}
        </ul>
      </div>

      {/* Knowledge Hub */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <FileText size={18} color="#4CA771" />
          <h2>{language === "en" ? "Knowledge Hub" : "คลังความรู้"}</h2>
        </div>
        <ul className={styles.list}>
          {articles.map((a, i) => (
            <li key={i}>{language === "en" ? a.en : a.th}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
