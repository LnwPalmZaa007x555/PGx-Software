"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle, XCircle, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./page.module.css";
import { fetchPatients, type PatientDto, updatePatientById } from "@/utils/patients";
import { fetchLatestResultForPatient, updateResultStatus } from "@/utils/results";
import { genotypeMappings } from "@/utils/mappings";

type PatientRow = {
  recordId: number;
  idCard: string;
  firstName: string;
  lastName: string;
  sex: string;
  phone: string;
  ethnicity: string;
  status: "pending_gene" | "pending_approve" | "approved";
};

function mapStatus(s: string): PatientRow["status"] {
  const v = (s || "").toLowerCase();
  if (v === "pending approval") return "pending_approve";
  if (v === "post-analytic" || v === "approved") return "approved";
  return "pending_gene";
}

function toRows(items: PatientDto[]): PatientRow[] {
  return items.map((p) => ({
    recordId: p.Patient_Id,
    idCard: p.Id_Card,
    firstName: p.Fname,
    lastName: p.Lname,
    sex: (p.Gender || "").toLowerCase(),
    phone: p.Phone,
    ethnicity: p.Ethnicity,
    status: mapStatus(p.status || ""),
  }));
}

function nowBangkokISO(): string {
  const offset = 7 * 60 * 60 * 1000;
  return new Date(Date.now() + offset).toISOString().replace("Z", "+07:00");
}

type DetailState = {
  geneName: string;
  markers: Record<string, string>;
  genotype: string;              // mapped from markers if mapping exists
  predictPheno: string | null;   // phenotype from backend
  recommend: string | null;      // recommendation from backend
  resultId: number | null;       // latest Result_Id for this patient
} | null;

export default function ApprovePage() {
  const { language } = useLanguage();

  const [searchId, setSearchId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [patientList, setPatientList] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>(null);

  useEffect(() => {
    (async () => {
      try {
        const items = await fetchPatients();
        setPatientList(toRows(items));
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // filter patients waiting for approval
  const pendingApprovals = useMemo(() => {
    const list = Array.isArray(patientList) ? patientList : [];
    const q = (searchId ?? "").trim();
    return list.filter((p) => {
      if (!p) return false;
      if ((p.status || "").toLowerCase() !== "pending_approve") return false;
      if (!q) return true;
      return (p.idCard || "").includes(q);
    });
  }, [patientList, searchId]);

  // อย่าอิง selectedPatient จาก pendingApprovals เพราะจะหลุดตอนพิมพ์ค้นหา
  const selectedPatient = useMemo(
    () => (selectedId ? patientList.find((p) => p.idCard === selectedId) || null : null),
    [patientList, selectedId]
  );

  const handleSelectPatient = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setDetail(null);
      setDetailError(null);
    } else {
      setSelectedId(id);
    }
  };

  // เคลียร์ selection เมื่อเปลี่ยน search เพื่อกัน state ค้าง
  useEffect(() => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  }, [searchId]);

  // Load latest result details when a patient is selected (ปรับให้ตรง backend ที่ใช้ gene_meta)
  useEffect(() => {
    (async () => {
      setDetail(null);
      setDetailError(null);
      if (!selectedPatient) return;

      try {
        setDetailLoading(true);
        const data = await fetchLatestResultForPatient(selectedPatient.recordId);
        console.log(data)
        if (!data) {
          setDetail(null);
          return;
        }

        // ---- Defensive parsing ให้เข้ากับ backend ปัจจุบัน ----
        // backend (saveToResult) ส่งกลับประมาณนี้:
        // { ..., gene_meta: { gene_name, hla_gene, status, phenotype, recommend }, ... }
        const geneName: string =
          data?.gene?.gene_name ??
          data?.gene_meta?.gene_name ??
          "";

        // markers อาจไม่มีสำหรับ HLA; กัน null ให้เป็น {} ไว้
        const markers: Record<string, string> =
          data?.markers ??
          data?.gene_meta?.markers ??
          {};

        const predictPheno: string | null =
          data?.predict_pheno ??
          data?.gene_meta?.phenotype ??
          data?.gene_meta?.predict_pheno ??
          null;

        const recommend: string | null =
          data?.recommend ??
          data?.gene_meta?.recommend ??
          null;

        // สร้าง genotype จาก mappings ถ้ามี
        let genotype = "";
        const gm = genotypeMappings[geneName as keyof typeof genotypeMappings];
        if (gm && typeof gm.mapToGenotype === "function") {
          try {
            genotype = gm.mapToGenotype(markers as any) || "";
          } catch {
            genotype = "";
          }
        }

        setDetail({
          geneName,
          markers,
          genotype,
          predictPheno,
          recommend,
          resultId: data?.result?.Result_Id ?? null,
        });
      } catch (e: any) {
        setDetailError(e?.response?.data?.error || e?.message || "Failed to load result");
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedPatient]);

  async function handleApprove(id: string) {
    const row = patientList.find((p) => p.idCard === id);
    if (!row) return;
    try {
      await updatePatientById(row.recordId, { status: "Post-analytic", approve_at: nowBangkokISO() });
      setPatientList((prev) => prev.map((p) => (p.idCard === id ? { ...p, status: "approved" } : p)));
      alert(language === "en" ? "✅ Patient approved successfully!" : "✅ อนุมัติผู้ป่วยสำเร็จแล้ว!");
      setSelectedId(null);
      setDetail(null);
    } catch (e: any) {
      const err = e?.response?.data?.error;
      let msg = e?.message || (language === "en" ? "Approve failed" : "อนุมัติไม่สำเร็จ");
      if (err && typeof err === "object") {
        // handle zod flatten shape
        const fields = err.fieldErrors ? Object.values(err.fieldErrors).flat() : [];
        const forms = err.formErrors || [];
        const all = [...(forms || []), ...(fields || [])].filter(Boolean) as string[];
        if (all.length) msg = all.join("\n");
      } else if (typeof err === "string") {
        msg = err;
      }
      alert(msg);
    }
  }

  async function handleReject(id: string) {
    const row = patientList.find((p) => p.idCard === id);
    if (!row) return;
    try {
      // Mark latest result as rejected for KPI/metrics
      if (detail?.resultId) {
        await updateResultStatus(detail.resultId, "rejected");
      }
      await updatePatientById(row.recordId, { status: "Pending", approve_at: null });
      setPatientList((prev) => prev.map((p) => (p.idCard === id ? { ...p, status: "pending_gene" } : p)));
      alert(language === "en" ? "❌ Sent back for correction." : "❌ ส่งกลับเพื่อแก้ไขข้อมูล.");
      setSelectedId(null);
      setDetail(null);
    } catch (e: any) {
      const err = e?.response?.data?.error;
      let msg = e?.message || (language === "en" ? "Send back failed" : "ส่งกลับไม่สำเร็จ");
      if (err && typeof err === "object") {
        const fields = err.fieldErrors ? Object.values(err.fieldErrors).flat() : [];
        const forms = err.formErrors || [];
        const all = [...(forms || []), ...(fields || [])].filter(Boolean) as string[];
        if (all.length) msg = all.join("\n");
      } else if (typeof err === "string") {
        msg = err;
      }
      alert(msg);
    }
  }

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
        {/* LEFT */}
        <div className={styles.left}>
          <div className={styles.chartBox}>
            <h3>
              <ClipboardCheck size={18} color="#4CA771" style={{ marginRight: 6 }} />
              {language === "en" ? "Pending Approvals" : "รอการอนุมัติ"}
            </h3>
            <p className={styles.sectionNote}>
              {language === "en"
                ? "Select a patient to review and approve genetic data."
                : "เลือกผู้ป่วยเพื่อดูรายละเอียดและอนุมัติข้อมูลยีน"}
            </p>

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
                onChange={(e) => setSearchId(e.target.value.replace(/\D/g, "").slice(0, 13))}
              />
              <button className={styles.searchButton}>
                <Search size={18} />
              </button>
            </div>

            {loading ? (
              <p>{language === "en" ? "Loading…" : "กำลังโหลด…"}</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : pendingApprovals.length === 0 ? (
              <p>
                {language === "en" ? "No pending approvals found." : "ไม่พบผู้ป่วยที่รอการอนุมัติ"}
              </p>
            ) : (
              <div className={styles.scrollBox}>
                {pendingApprovals.map((p) => (
                  <div
                    key={p.idCard || String(p.recordId)}
                    className={`${styles.patientCard} ${selectedId === p.idCard ? styles.selected : ""}`}
                    onClick={() => handleSelectPatient(p.idCard)}
                  >
                    <div className={styles.patientName}>
                      {p.firstName} {p.lastName}
                    </div>
                    <div className={styles.patientInfo}>
                      <span>
                        {language === "en" ? "ID:" : "เลขบัตร:"} {p.idCard}
                      </span>
                      <span className={styles.statusBadge}>
                        {language === "en" ? "Pending approval" : "รอการอนุมัติ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          {selectedPatient ? (
            <div className={styles.detailBox}>
              <h3>{language === "en" ? "Patient Details" : "รายละเอียดผู้ป่วย"}</h3>
              <p className={styles.sectionNote}>
                {language === "en"
                  ? "Review patient information before approval."
                  : "ตรวจสอบข้อมูลผู้ป่วยก่อนการอนุมัติ"}
              </p>

              <div className={styles.infoGrid}>
                <p><strong>{language === "en" ? "Name:" : "ชื่อ:"}</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p><strong>{language === "en" ? "ID:" : "เลขบัตร:"}</strong> {selectedPatient.idCard}</p>
                <p><strong>{language === "en" ? "Sex:" : "เพศ:"}</strong> {selectedPatient.sex}</p>
                <p><strong>{language === "en" ? "Phone:" : "โทรศัพท์:"}</strong> {selectedPatient.phone}</p>
                <p><strong>{language === "en" ? "Ethnicity:" : "เชื้อชาติ:"}</strong> {selectedPatient.ethnicity}</p>
              </div>

              <div className={styles.geneSection}>
                <h4>{language === "en" ? "Genetic Information" : "ข้อมูลทางพันธุกรรม"}</h4>
                {detailLoading ? (
                  <p>{language === "en" ? "Loading…" : "กำลังโหลด…"}</p>
                ) : detailError ? (
                  <p className={styles.error}>{detailError}</p>
                ) : !detail ? (
                  <p>{language === "en" ? "No genetic result found yet." : "ยังไม่มีผลยีน"}</p>
                ) : (
                  <div>
                    <p>
                      <strong>{language === "en" ? "Gene:" : "ยีน:"}</strong> {detail.geneName}
                    </p>

                    {Object.keys(detail.markers).length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <strong>{language === "en" ? "Markers:" : "มาร์คเกอร์:"}</strong>
                        <ul style={{ marginTop: 4 }}>
                          {Object.entries(detail.markers).map(([k, v]) => (
                            <li key={k}>
                              {k}: {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {detail.genotype && (
                      <p style={{ marginTop: 8 }}>
                        <strong>{language === "en" ? "Genotype:" : "จีโนไทป์:"}</strong> {detail.genotype}
                      </p>
                    )}
                    {detail.predictPheno && (
                      <p>
                        <strong>{language === "en" ? "Phenotype:" : "ฟีโนไทป์:"}</strong> {detail.predictPheno}
                      </p>
                    )}
                    {detail.recommend && (
                      <p>
                        <strong>{language === "en" ? "Recommendation:" : "คำแนะนำ:"}</strong> {detail.recommend}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button onClick={() => handleApprove(selectedPatient.idCard)} className={`${styles.button} ${styles.approveBtn}`}>
                  <CheckCircle size={18} style={{ marginRight: 6 }} /> {language === "en" ? "Approve" : "อนุมัติ"}
                </button>
                <button onClick={() => handleReject(selectedPatient.idCard)} className={`${styles.button} ${styles.rejectBtn}`}>
                  <XCircle size={18} style={{ marginRight: 6 }} /> {language === "en" ? "Send Back" : "ส่งกลับ"}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyBox}>
              <p>{language === "en" ? "Select a patient to view their details." : "เลือกผู้ป่วยเพื่อดูรายละเอียด"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
