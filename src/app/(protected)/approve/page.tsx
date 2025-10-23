"use client";

import { useState, useMemo } from "react";
import { usePatients } from "@/context/PatientContext";
import { Search, CheckCircle, XCircle, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./page.module.css";

export default function ApprovePage() {
  const { patients, updatePatients } = usePatients();
  const { language } = useLanguage();

  const [searchId, setSearchId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // filter patients waiting for approval
  const pendingApprovals = useMemo(() => {
    return patients.filter(
      (p) =>
        p.status === "pending_approve" &&
        p.idCard.includes(searchId.trim())
    );
  }, [patients, searchId]);

  const handleSelectPatient = (id: string) => {
    if (selectedId === id) setSelectedId(null);
    else setSelectedId(id);
  };

  const handleApprove = (id: string) => {
    const updated = patients.map((p) =>
      p.idCard === id ? { ...p, status: "approved" as const } : p
    );
    updatePatients(updated);
    alert(
      language === "en"
        ? "✅ Patient approved successfully!"
        : "✅ อนุมัติผู้ป่วยสำเร็จแล้ว!"
    );
    setSelectedId(null);
  };

  const handleReject = (id: string) => {
    const updated = patients.map((p) =>
      p.idCard === id ? { ...p, status: "pending_gene" as const } : p
    );
    updatePatients(updated);
    alert(
      language === "en"
        ? "❌ Sent back for correction."
        : "❌ ส่งกลับเพื่อแก้ไขข้อมูล."
    );
    setSelectedId(null);
  };

  const selectedPatient = pendingApprovals.find((p) => p.idCard === selectedId);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {language === "en" ? "Approval Management" : "การอนุมัติผลผู้ป่วย"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Review and approve patients’ pharmacogenomic results."
          : "ตรวจสอบและอนุมัติผลเภสัชพันธุศาสตร์ของผู้ป่วย"}
      </p>

      <div className={styles.grid}>
        {/* LEFT SIDE */}
        <div className={styles.left}>
          <div className={styles.chartBox}>
            <h3>
              <ClipboardCheck
                size={18}
                color="#4CA771"
                style={{ marginRight: 6 }}
              />
              {language === "en" ? "Pending Approvals" : "รอการอนุมัติ"}
            </h3>
            <p className={styles.sectionNote}>
              {language === "en"
                ? "Select a patient to review and approve genetic data."
                : "เลือกผู้ป่วยเพื่อดูรายละเอียดและอนุมัติข้อมูลยีน"}
            </p>

            {/* Search bar */}
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder={
                  language === "en"
                    ? "Search by ID Card (13 digits)"
                    : "ค้นหาด้วยเลขบัตรประชาชน (13 หลัก)"
                }
                className={styles.searchInput}
                value={searchId}
                onChange={(e) =>
                  setSearchId(e.target.value.replace(/\D/g, "").slice(0, 13))
                }
              />
              <button className={styles.searchButton}>
                <Search size={18} />
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <p>
                {language === "en"
                  ? "No pending approvals found."
                  : "ไม่พบผู้ป่วยที่รอการอนุมัติ"}
              </p>
            ) : (
              <div className={styles.scrollBox}>
                {pendingApprovals.map((p) => (
                  <div
                    key={p.idCard}
                    className={`${styles.patientCard} ${
                      selectedId === p.idCard ? styles.selected : ""
                    }`}
                    onClick={() => handleSelectPatient(p.idCard)}
                  >
                    <div className={styles.patientName}>
                      {p.firstName} {p.lastName}
                    </div>
                    <div className={styles.patientInfo}>
                      <span>
                        {language === "en" ? "ID:" : "เลขบัตร:"} {p.idCard}
                      </span>
                      <span className={`${styles.statusBadge}`}>
                        {language === "en" ? "Pending approval" : "รอการอนุมัติ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className={styles.right}>
          {selectedPatient ? (
            <div className={styles.detailBox}>
              <h3>
                {language === "en"
                  ? "Patient Details"
                  : "รายละเอียดผู้ป่วย"}
              </h3>
              <p className={styles.sectionNote}>
                {language === "en"
                  ? "Review genetic and personal information before approval."
                  : "ตรวจสอบข้อมูลส่วนบุคคลและผลยีนก่อนการอนุมัติ"}
              </p>

              <div className={styles.infoGrid}>
                <p>
                  <strong>{language === "en" ? "Name:" : "ชื่อ:"}</strong>{" "}
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p>
                  <strong>{language === "en" ? "ID:" : "เลขบัตร:"}</strong>{" "}
                  {selectedPatient.idCard}
                </p>
                <p>
                  <strong>{language === "en" ? "Sex:" : "เพศ:"}</strong>{" "}
                  {selectedPatient.sex}
                </p>
                <p>
                  <strong>{language === "en" ? "DOB:" : "วันเกิด:"}</strong>{" "}
                  {selectedPatient.dob}
                </p>
                <p>
                  <strong>{language === "en" ? "Phone:" : "โทรศัพท์:"}</strong>{" "}
                  {selectedPatient.phone}
                </p>
                <p>
                  <strong>{language === "en" ? "Ethnicity:" : "เชื้อชาติ:"}</strong>{" "}
                  {selectedPatient.ethnicity}
                </p>
              </div>

              <div className={styles.geneSection}>
                <h4>
                  {language === "en"
                    ? "Genetic Information"
                    : "ข้อมูลทางพันธุกรรม"}
                </h4>
                <p>
                  <strong>{language === "en" ? "Gene:" : "ยีน:"}</strong>{" "}
                  {selectedPatient.gene}
                </p>
                <p>
                  <strong>{language === "en" ? "Genotype:" : "จีโนไทป์:"}</strong>{" "}
                  {selectedPatient.genotype}
                </p>
                <p>
                  <strong>{language === "en" ? "Phenotype:" : "ฟีโนไทป์:"}</strong>{" "}
                  {selectedPatient.phenotype}
                </p>
                <p>
                  <strong>
                    {language === "en" ? "Recommendation:" : "คำแนะนำ:"}
                  </strong>{" "}
                  {selectedPatient.recommendation}
                </p>
              </div>

              <div className={styles.actions}>
                <button
                  onClick={() => handleApprove(selectedPatient.idCard)}
                  className={`${styles.button} ${styles.approveBtn}`}
                >
                  <CheckCircle size={18} style={{ marginRight: 6 }} />{" "}
                  {language === "en" ? "Approve" : "อนุมัติ"}
                </button>
                <button
                  onClick={() => handleReject(selectedPatient.idCard)}
                  className={`${styles.button} ${styles.rejectBtn}`}
                >
                  <XCircle size={18} style={{ marginRight: 6 }} />{" "}
                  {language === "en" ? "Send Back" : "ส่งกลับ"}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <p>
                {language === "en"
                  ? "Select a patient to view their details."
                  : "เลือกผู้ป่วยเพื่อดูรายละเอียด"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
