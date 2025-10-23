"use client";

import { useState, useMemo } from "react";
import { usePatients } from "@/context/PatientContext";
import { Search, Download, Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./page.module.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const { patients } = usePatients();
  const { language } = useLanguage();

  const [filter, setFilter] = useState<
    "all" | "pending_gene" | "pending_approve" | "approved"
  >("all");
  const [search, setSearch] = useState("");

  // 🎯 Summary Count
  const summary = useMemo(
    () => ({
      total: patients.length,
      pending_gene: patients.filter((p) => p.status === "pending_gene").length,
      pending_approve: patients.filter(
        (p) => p.status === "pending_approve"
      ).length,
      approved: patients.filter((p) => p.status === "approved").length,
    }),
    [patients]
  );

  // 🧠 Filtered Patient List
  const filteredPatients = useMemo(() => {
    return patients
      .filter(
        (p) =>
          (filter === "all" ? true : p.status === filter) &&
          (p.firstName.toLowerCase().includes(search.toLowerCase()) ||
            p.lastName.toLowerCase().includes(search.toLowerCase()) ||
            p.idCard.includes(search))
      )
      .reverse();
  }, [patients, filter, search]);

  // 🧮 Pie chart data
  const pieData = [
    {
      name: language === "en" ? "Pending Gene" : "รอกรอกยีน",
      value: summary.pending_gene,
      color: "#e55353",
    },
    {
      name: language === "en" ? "Pending Approve" : "รออนุมัติ",
      value: summary.pending_approve,
      color: "#f4b400",
    },
    {
      name: language === "en" ? "Approved" : "อนุมัติแล้ว",
      value: summary.approved,
      color: "#2b9348",
    },
  ];

  // 📤 Export CSV
  const exportCSV = () => {
    const headers =
      language === "en"
        ? [
            "First Name",
            "Last Name",
            "ID",
            "Gene",
            "Genotype",
            "Phenotype",
            "Status",
          ]
        : [
            "ชื่อ",
            "นามสกุล",
            "เลขบัตรประชาชน",
            "ยีน",
            "จีโนไทป์",
            "ฟีโนไทป์",
            "สถานะ",
          ];
    const rows = patients.map((p) => [
      p.firstName,
      p.lastName,
      p.idCard,
      p.gene || "-",
      p.genotype || "-",
      p.phenotype || "-",
      p.status || "-",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      language === "en"
        ? "PGx_Patient_Report.csv"
        : "รายงานผู้ป่วย_PGx.csv";
    a.click();
  };

  // ----------------- Render -----------------
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {language === "en" ? "PGx Dashboard" : "ภาพรวมระบบ PGx"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Pharmacogenomics data overview and workflow monitoring."
          : "ภาพรวมข้อมูลเภสัชพันธุศาสตร์และสถานะการดำเนินงาน"}
      </p>

      {/* Summary Cards */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.total}`}>
          <h3>{language === "en" ? "Total Patients" : "จำนวนผู้ป่วยทั้งหมด"}</h3>
          <p className={styles.number}>{summary.total}</p>
        </div>
        <div className={`${styles.card} ${styles.pendingGene}`}>
          <h3>{language === "en" ? "Pending Gene" : "รอกรอกยีน"}</h3>
          <p className={styles.number}>{summary.pending_gene}</p>
        </div>
        <div className={`${styles.card} ${styles.pendingApprove}`}>
          <h3>{language === "en" ? "Pending Approve" : "รออนุมัติ"}</h3>
          <p className={styles.number}>{summary.pending_approve}</p>
        </div>
        <div className={`${styles.card} ${styles.approved}`}>
          <h3>{language === "en" ? "Approved" : "อนุมัติแล้ว"}</h3>
          <p className={styles.number}>{summary.approved}</p>
        </div>
      </div>

      {/* Chart + Filter/Search */}
      <div className={styles.topRow}>
        <div className={styles.chartBox}>
          <h3>{language === "en" ? "Status Distribution" : "สัดส่วนสถานะผู้ป่วย"}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            {["all", "pending_gene", "pending_approve", "approved"].map(
              (status) => (
                <button
                  key={status}
                  className={`${styles.filterBtn} ${
                    filter === status ? styles.activeFilter : ""
                  }`}
                  onClick={() => setFilter(status as any)}
                >
                  {language === "en"
                    ? status === "all"
                      ? "All"
                      : status
                          .replace("_", " ")
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                    : status === "all"
                    ? "ทั้งหมด"
                    : status === "pending_gene"
                    ? "รอกรอกยีน"
                    : status === "pending_approve"
                    ? "รออนุมัติ"
                    : "อนุมัติแล้ว"}
                </button>
              )
            )}
          </div>

          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder={
                language === "en"
                  ? "Search by Name or ID..."
                  : "ค้นหาด้วยชื่อหรือเลขบัตร..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.searchButton}>
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Table */}
      <div className={styles.tableBox}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{language === "en" ? "Name" : "ชื่อ-นามสกุล"}</th>
              <th>{language === "en" ? "ID" : "เลขบัตรประชาชน"}</th>
              <th>{language === "en" ? "Gene" : "ยีน"}</th>
              <th>{language === "en" ? "Genotype" : "จีโนไทป์"}</th>
              <th>{language === "en" ? "Phenotype" : "ฟีโนไทป์"}</th>
              <th>{language === "en" ? "Status" : "สถานะ"}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "1rem" }}>
                  {language === "en"
                    ? "No matching patients found."
                    : "ไม่พบข้อมูลผู้ป่วยที่ตรงกัน"}
                </td>
              </tr>
            ) : (
              filteredPatients.map((p) => (
                <tr key={p.idCard}>
                  <td>
                    {p.firstName} {p.lastName}
                  </td>
                  <td>{p.idCard}</td>
                  <td>{p.gene || "-"}</td>
                  <td>{p.genotype || "-"}</td>
                  <td>{p.phenotype || "-"}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        p.status === "pending_gene"
                          ? styles.statusPending
                          : p.status === "pending_approve"
                          ? styles.statusReview
                          : styles.statusApproved
                      }`}
                    >
                      {language === "en"
                        ? p.status!.replace("_", " ")
                        : p.status === "pending_gene"
                        ? "รอกรอกยีน"
                        : p.status === "pending_approve"
                        ? "รออนุมัติ"
                        : "อนุมัติแล้ว"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* System Activity */}
      <div className={styles.activityBox}>
        <h3>
          <Activity size={18} color="#4CA771" style={{ marginRight: 6 }} />
          {language === "en"
            ? "Recent System Activity"
            : "กิจกรรมล่าสุดของระบบ"}
        </h3>
        <ul className={styles.activityList}>
          {language === "en" ? (
            <>
              <li>🧬 Pharmacist Sarah approved HLA-B*15:02 for patient Emily Davis</li>
              <li>📥 System uploaded CYP2C9 report for patient John Smith</li>
              <li>👩‍⚕️ Doctor Michael reviewed patient phenotype data</li>
            </>
          ) : (
            <>
              <li>🧬 เภสัชกร Sarah อนุมัติผล HLA-B*15:02 ของผู้ป่วย Emily Davis</li>
              <li>📥 ระบบอัปโหลดรายงานยีน CYP2C9 ของผู้ป่วย John Smith</li>
              <li>👩‍⚕️ แพทย์ Michael ตรวจสอบข้อมูลฟีโนไทป์ของผู้ป่วย</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
