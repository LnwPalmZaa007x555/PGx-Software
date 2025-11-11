"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, Download, FileText } from "lucide-react";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import styles from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { fetchDashboard, type DashboardData } from "@/utils/dashboard";

export default function ReportsPage() {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "th";

  // filters (for export UI only)
  const [month, setMonth] = useState("October");
  const [year, setYear] = useState("2025");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await fetchDashboard();
        setData(d);
      } catch (e: unknown) {
        const apiErr = (e as { response?: { data?: { error?: unknown } } }).response?.data?.error;
        const msg = typeof apiErr === "string" ? apiErr : e instanceof Error ? e.message : "Failed to load";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summaryCards = useMemo(() => {
    const ex = data?.execSummary;
    return [
      { label: lang === "en" ? "Cases (Today)" : "จำนวนเคสวันนี้", value: ex?.today ?? 0 },
      { label: lang === "en" ? "This Week" : "สัปดาห์นี้", value: ex?.thisWeek ?? 0 },
      { label: lang === "en" ? "This Month" : "เดือนนี้", value: ex?.thisMonth ?? 0 },
      { label: lang === "en" ? "Total Tests" : "รายการตรวจทั้งหมด", value: ex?.totalTests ?? 0 },
    ];
  }, [data, lang]);

  const barData = useMemo(() => {
    const wk = data?.weeklyCases ?? [0, 0, 0, 0];
    return [
      { name: lang === "en" ? "Week 1" : "สัปดาห์ 1", cases: wk[0] ?? 0 },
      { name: lang === "en" ? "Week 2" : "สัปดาห์ 2", cases: wk[1] ?? 0 },
      { name: lang === "en" ? "Week 3" : "สัปดาห์ 3", cases: wk[2] ?? 0 },
      { name: lang === "en" ? "Week 4" : "สัปดาห์ 4", cases: wk[3] ?? 0 },
    ];
  }, [data, lang]);

  const tatData = useMemo(() => {
    const t = data?.tatTracking;
    return [
      { name: "Pre-Analytic", value: t?.preAnalytic ?? 0 },
      { name: "Analytic", value: t?.analytic ?? 0 },
      { name: "Post-Analytic", value: t?.postAnalytic ?? 0 },
    ];
  }, [data]);

  // Removed unused local kpi array (use data directly in render)

  const COLORS = ["#4ca771", "#81c784", "#c8e6c9"];

  const handleExport = (type: "CSV" | "PDF") => {
    alert(
      lang === "en"
        ? `Exporting ${type} for ${month} ${year} (mock)`
        : `ส่งออกไฟล์ ${type} สำหรับ ${month} ${year} (จำลอง)`
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {lang === "en"
          ? "Reports & Analytics"
          : "รายงานและสถิติ (Reports & Analytics)"}
      </h1>
      <p className={styles.subtitle}>
        {lang === "en"
          ? "Executive dashboard and key performance metrics."
          : "แดชบอร์ดสรุปผู้บริหารและตัวชี้วัดคุณภาพหลัก"}
      </p>

      {loading ? (
        <p>{lang === "en" ? "Loading..." : "กำลังโหลด..."}</p>
      ) : error ? (
        <p style={{ color: "#b91c1c" }}>{error}</p>
      ) : (
        <>
          {/* Executive Summary */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <BarChart2 size={18} /> {" "}
              {lang === "en" ? "Executive Dashboard" : "แดชบอร์ดสรุปผู้บริหาร"}
            </h2>

            <div className={styles.cardGrid}>
              {summaryCards.map((c, i) => (
                <div key={i} className={styles.card}>
                  <div className={styles.cardLabel}>{c.label}</div>
                  <div className={styles.cardValue}>{c.value}</div>
                </div>
              ))}
            </div>

            <div className={styles.chartRow}>
              {/* Bar chart */}
              <RBarChart width={400} height={220} data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cases" fill="#4ca771" radius={[4, 4, 0, 0]} />
              </RBarChart>

              {/* Pie chart */}
              <RPieChart width={350} height={220}>
                <Pie
                  data={tatData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label
                >
                  {tatData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </RPieChart>
            </div>
          </div>

          {/* Export Statistics */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <FileText size={18} />{" "}
              {lang === "en" ? "Export Statistics" : "ระบบ Export สถิติ"}
            </h2>
            <div className={styles.exportBar}>
              <select
                className={styles.select}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                className={styles.select}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {["2024","2025","2026"].map(y => <option key={y}>{y}</option>)}
              </select>

              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => handleExport("CSV")}
              >
                <Download size={16} /> CSV
              </button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => handleExport("PDF")}
              >
                <FileText size={16} /> PDF
              </button>
            </div>
          </div>

          {/* KPI Table */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {lang === "en" ? "Quality KPIs" : "ตัวชี้วัดคุณภาพ (KPI)"}
            </h2>
            <div className={styles.tableBox}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{lang === "en" ? "Metric" : "ตัวชี้วัด"}</th>
                    <th>{lang === "en" ? "Value" : "ค่า (%)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: lang === "en" ? "Rejection Rate" : "อัตราการปฏิเสธสิ่งส่งตรวจ", value: `${data?.kpiQuality.rejectionRate ?? 0}%` },
                    { name: lang === "en" ? "Average TAT (hrs)" : "TAT เฉลี่ย (ชม.)", value: String(data?.kpiQuality.averageTatHours ?? 0) },
                  ].map((k, i) => (
                    <tr key={i}>
                      <td>{k.name}</td>
                      <td>{k.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
