"use client";

import { useState, useMemo } from "react";
import { usePatients } from "@/context/PatientContext";
import { useLanguage } from "@/context/LanguageContext";
import { Search, Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./page.module.css";

export default function ReportsPage() {
  const { patients } = usePatients();
  const { language } = useLanguage();
  const [search, setSearch] = useState("");

  // ✅ Filter only approved patients
  const approvedPatients = useMemo(() => {
    return patients
      .filter(
        (p) =>
          p.status === "approved" &&
          (p.firstName.toLowerCase().includes(search.toLowerCase()) ||
            p.lastName.toLowerCase().includes(search.toLowerCase()) ||
            p.idCard.includes(search))
      )
      .reverse();
  }, [patients, search]);

  // 📤 Export CSV
  const exportCSV = () => {
    const headers =
      language === "en"
        ? [
            "First Name",
            "Last Name",
            "ID Card",
            "Gene",
            "Genotype",
            "Phenotype",
            "Status",
          ]
        : ["ชื่อ", "นามสกุล", "เลขบัตรประชาชน", "ยีน", "จีโนไทป์", "ฟีโนไทป์", "สถานะ"];

    const rows = approvedPatients.map((p) => [
      p.firstName,
      p.lastName,
      p.idCard,
      p.gene || "-",
      p.genotype || "-",
      p.phenotype || "-",
      language === "en" ? "Approved" : "อนุมัติแล้ว",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      language === "en" ? "PGx_Approved_Reports.csv" : "รายงานผู้ป่วย_PGx.csv";
    a.click();
  };

  // 🧾 Export PDF
  const exportPDF = () => {
    const doc = new jsPDF("p", "pt");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      language === "en"
        ? "PGx Approved Patient Reports"
        : "รายงานผู้ป่วยที่ได้รับการอนุมัติ (PGx)",
      40,
      40
    );

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `${language === "en" ? "Generated on:" : "สร้างเมื่อ:"} ${new Date().toLocaleString()}`,
      40,
      60
    );

    const tableColumn =
      language === "en"
        ? ["Name", "ID Card", "Gene", "Genotype", "Phenotype", "Status"]
        : ["ชื่อ-นามสกุล", "เลขบัตรประชาชน", "ยีน", "จีโนไทป์", "ฟีโนไทป์", "สถานะ"];

    const tableRows = approvedPatients.map((p) => [
      `${p.firstName} ${p.lastName}`,
      p.idCard,
      p.gene || "-",
      p.genotype || "-",
      p.phenotype || "-",
      language === "en" ? "Approved" : "อนุมัติแล้ว",
    ]);

    autoTable(doc, {
      startY: 80,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 9, cellPadding: 5, halign: "left" },
      headStyles: {
        fillColor: [76, 167, 113],
        textColor: [255, 255, 255],
      },
    });

    doc.save(
      language === "en" ? "PGx_Approved_Reports.pdf" : "รายงานผู้ป่วย_PGx.pdf"
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {language === "en" ? "Approved Reports" : "รายงานที่อนุมัติแล้ว"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Review and export pharmacogenomic reports of approved patients."
          : "ตรวจสอบและส่งออกรายงานเภสัชพันธุศาสตร์ของผู้ป่วยที่ได้รับการอนุมัติแล้ว"}
      </p>

      {/* Top Controls */}
      <div className={styles.topBar}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder={
              language === "en"
                ? "Search by Name or ID..."
                : "ค้นหาด้วยชื่อหรือเลขบัตร..."
            }
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.searchButton}>
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableBox}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{language === "en" ? "Name" : "ชื่อ-นามสกุล"}</th>
              <th>{language === "en" ? "ID Card" : "เลขบัตรประชาชน"}</th>
              <th>{language === "en" ? "Gene" : "ยีน"}</th>
              <th>{language === "en" ? "Genotype" : "จีโนไทป์"}</th>
              <th>{language === "en" ? "Phenotype" : "ฟีโนไทป์"}</th>
              <th>{language === "en" ? "Status" : "สถานะ"}</th>
              <th>{language === "en" ? "Action" : "การจัดการ"}</th>
            </tr>
          </thead>
          <tbody>
            {approvedPatients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "1rem" }}>
                  {language === "en"
                    ? "No approved reports found."
                    : "ไม่พบรายงานที่ได้รับการอนุมัติ"}
                </td>
              </tr>
            ) : (
              approvedPatients.map((p) => (
                <tr key={p.idCard}>
                  <td>
                    {p.firstName} {p.lastName}
                  </td>
                  <td>{p.idCard}</td>
                  <td>{p.gene || "-"}</td>
                  <td>{p.genotype || "-"}</td>
                  <td>{p.phenotype || "-"}</td>
                  <td>
                    <span className={styles.statusApproved}>
                      {language === "en" ? "Approved" : "อนุมัติแล้ว"}
                    </span>
                  </td>
                  <td>
                    <button onClick={exportPDF} className={styles.exportBtnSmall}>
                      {language === "en" ? "Export" : "ส่งออก"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
