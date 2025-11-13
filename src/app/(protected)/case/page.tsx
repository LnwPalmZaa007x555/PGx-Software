"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Trash2, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./page.module.css";
import {
  fetchPatients,
  deletePatientById,
  type PatientDto,
} from "@/utils/patients";

type PatientRow = {
  recordId: number;
  idCard: string;
  firstName: string;
  lastName: string;
  sex: string;
  age: number;
  phone: string;
  ethnicity: "thai" | "other";
  otherEthnicity?: string;
  status: "pending_gene" | "pending_approve" | "approved";
};

function mapStatus(s: string): PatientRow["status"] {
  const v = (s || "").toLowerCase();
  if (v === "pending") return "pending_gene";
  if (v === "pending approval") return "pending_approve";
  if (v === "post-analytic" || v === "approved") return "approved";
  return "pending_gene";
}

function toRows(items: PatientDto[]): PatientRow[] {
  return items.map((p) => {
    const isThai = (p.Ethnicity || "").trim().toLowerCase() === "thai";
    return {
      recordId: p.Patient_Id,
      idCard: p.Id_Card,
      firstName: p.Fname,
      lastName: p.Lname,
      sex: (p.Gender || "").toLowerCase() as "male" | "female",
      age: p.Age,
      phone: p.Phone,
      ethnicity: isThai ? "thai" : "other",
      otherEthnicity: isThai ? undefined : p.Ethnicity,
      status: mapStatus(p.status || ""),
    };
  });
}

export default function CaseListPage() {
  const { language } = useLanguage();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPatients();
        setPatients(toRows(data));
      } catch (e: unknown) {
        const apiErr = (e as { response?: { data?: { error?: unknown } } })
          .response?.data?.error;
        const msg =
          typeof apiErr === "string"
            ? apiErr
            : e instanceof Error
            ? e.message
            : "Failed to load";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // แยก 2 ตาราง
  const pendingRows = patients.filter(
    (p) => p.status === "pending_gene" || p.status === "pending_approve"
  );
  const approvedRows = patients.filter((p) => p.status === "approved");

  const handleDelete = async (idCard: string, recordId: number) => {
    if (
      !confirm(
        language === "en"
          ? "Do you want to delete this patient?"
          : "ต้องการลบข้อมูลผู้ป่วยนี้หรือไม่?"
      )
    )
      return;
    try {
      await deletePatientById(recordId);
      setPatients((prev) => prev.filter((p) => p.idCard !== idCard));
    } catch (e: unknown) {
      const apiErr = (e as { response?: { data?: { error?: unknown } } })
        .response?.data?.error;
      const msg =
        typeof apiErr === "string"
          ? apiErr
          : e instanceof Error
          ? e.message
          : "Delete failed";
      alert(msg);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {language === "en" ? "Patient Cases" : "รายการผู้ป่วย / เคส"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "List of all patient records with TAT status"
          : "แสดงข้อมูลผู้ป่วยทั้งหมดพร้อมสถานะ TAT"}
      </p>

      <div className={styles.topBar}>
        <div className={styles.leftButtons}>
          <Link href="/case/add" className={styles.button}>
            <Plus size={18} style={{ marginRight: 6 }} />
            {language === "en" ? "Add New Case" : "เพิ่มเคสใหม่"}
          </Link>
        </div>
      </div>

      {/* ------------------------- TABLE 1 : PENDING ---------------------------- */}
      <h2 className={styles.sectionTitle}>
        {language === "en"
          ? "Pending / Pending Approval"
          : "รอกรอกยีน & รออนุมัติ"}
      </h2>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>HN</th>
              <th>{language === "en" ? "Name" : "ชื่อ-นามสกุล"}</th>
              <th>{language === "en" ? "Phone" : "เบอร์โทร"}</th>
              <th>{language === "en" ? "Sex" : "เพศ"}</th>
              <th>{language === "en" ? "Age" : "อายุ"}</th>
              <th>{language === "en" ? "Ethnicity" : "สัญชาติ"}</th>
              <th>{language === "en" ? "Status" : "สถานะ"}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  Loading…
                </td>
              </tr>
            ) : pendingRows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>
                  {language === "en"
                    ? "No pending cases."
                    : "ไม่มีเคสที่รอดำเนินการ"}
                </td>
              </tr>
            ) : (
              pendingRows.map((p) => (
                <tr key={p.recordId}>
                  <td>{p.idCard}</td>
                  <td>
                    {p.firstName} {p.lastName}
                  </td>
                  <td>{p.phone}</td>
                  <td>
                    {p.sex === "male"
                      ? language === "en"
                        ? "Male"
                        : "ชาย"
                      : language === "en"
                      ? "Female"
                      : "หญิง"}
                  </td>
                  <td>{p.age}</td>
                  <td>
                    {p.ethnicity === "thai"
                      ? language === "en"
                        ? "Thai"
                        : "ไทย"
                      : p.otherEthnicity || "-"}
                  </td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        p.status === "pending_gene"
                          ? styles.pending
                          : p.status === "pending_approve"
                          ? styles.review
                          : styles.approved
                      }`}
                    >
                      {language === "en"
                        ? p.status.replace("_", " ")
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

      {/* ------------------------- TABLE 2 : APPROVED ---------------------------- */}
      <h2 className={styles.sectionTitle}>
        {language === "en" ? "Approved" : "อนุมัติแล้ว"}
      </h2>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>HN</th>
              <th>{language === "en" ? "Name" : "ชื่อ-นามสกุล"}</th>
              <th>{language === "en" ? "Phone" : "เบอร์โทร"}</th>
              <th>{language === "en" ? "Sex" : "เพศ"}</th>
              <th>{language === "en" ? "Age" : "อายุ"}</th>
              <th>{language === "en" ? "Ethnicity" : "สัญชาติ"}</th>
              <th>{language === "en" ? "Status" : "สถานะ"}</th>
              <th>{language === "en" ? "Actions" : "จัดการ"}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Loading…
                </td>
              </tr>
            ) : approvedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  {language === "en"
                    ? "No approved cases."
                    : "ไม่มีเคสที่อนุมัติแล้ว"}
                </td>
              </tr>
            ) : (
              approvedRows.map((p) => (
                <tr key={p.recordId}>
                  <td>{p.idCard}</td>
                  <td>
                    {p.firstName} {p.lastName}
                  </td>
                  <td>{p.phone}</td>
                  <td>
                    {p.sex === "male"
                      ? language === "en"
                        ? "Male"
                        : "ชาย"
                      : language === "en"
                      ? "Female"
                      : "หญิง"}
                  </td>
                  <td>{p.age}</td>
                  <td>
                    {p.ethnicity === "thai"
                      ? language === "en"
                        ? "Thai"
                        : "ไทย"
                      : p.otherEthnicity || "-"}
                  </td>

                  <td>
                    <span className={`${styles.status} ${styles.approved}`}>
                      {language === "en" ? "Approved" : "อนุมัติแล้ว"}
                    </span>
                  </td>

                  <td className={styles.rowActions}>
                    <Link
                      href={`/case/${p.idCard}`}
                      className={styles.viewBtn}
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(p.idCard, p.recordId)}
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className={styles.empty} style={{ color: "#e55353" }}>
          {error}
        </div>
      )}
    </div>
  );
}
