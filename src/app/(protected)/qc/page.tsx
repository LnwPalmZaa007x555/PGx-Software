"use client";

import { useState } from "react";
import {
  ShieldCheck,
  BookOpen,
  FileText,
  ClipboardCheck,
  Upload,
  Check,
  X,
  Plus,
} from "lucide-react";
import styles from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";

interface SOP {
  id: string;
  title: string;
  version: string;
  status: "Approved" | "Under Review";
  lastReview: string;
}

interface QCRecord {
  date: string;
  instrument: string;
  result: "Pass" | "Fail";
  note: string;
}

interface QCDoc {
  id: string;
  name: string;
  type: string;
  uploaded: string;
}

interface TrainingLog {
  id: string;
  staff: string;
  sop: string;
  date: string;
  status: "Done" | "Pending";
}

export default function QCPage() {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "th";

  // SOPs mock
  const [sops, setSops] = useState<SOP[]>([
    {
      id: "SOP-001",
      title: "Sample Accessioning Procedure",
      version: "v2.0",
      status: "Approved",
      lastReview: "2025-10-20",
    },
    {
      id: "SOP-002",
      title: "DNA Extraction Protocol",
      version: "v1.3",
      status: "Under Review",
      lastReview: "2025-08-15",
    },
  ]);
  const [filter, setFilter] = useState("");
  const [training, setTraining] = useState<TrainingLog[]>([]);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);
  const [qcDocs, setQcDocs] = useState<QCDoc[]>([
    {
      id: "QC-001",
      name: "IQC Result Oct 2025",
      type: "IQC",
      uploaded: "2025-10-25",
    },
  ]);

  // New QC form state
  const [newQC, setNewQC] = useState<QCRecord>({
    date: "",
    instrument: "",
    result: "Pass",
    note: "",
  });

  const handleAddSOP = () => {
    const newSop: SOP = {
      id: `SOP-${String(sops.length + 1).padStart(3, "0")}`,
      title: "New SOP (mock)",
      version: "v1.0",
      status: "Under Review",
      lastReview: new Date().toISOString().split("T")[0],
    };
    setSops((p) => [...p, newSop]);
    alert(lang === "en" ? "Added mock SOP" : "เพิ่ม SOP จำลองแล้ว");
  };

  const handleMarkRead = (sop: SOP) => {
    const log: TrainingLog = {
      id: `${sop.id}-${Date.now()}`,
      staff: lang === "en" ? "Lab Staff (mock)" : "เจ้าหน้าที่แล็บ (จำลอง)",
      sop: sop.title,
      date: new Date().toISOString().split("T")[0],
      status: "Done",
    };
    setTraining((prev) => [log, ...prev]);
    alert(
      lang === "en"
        ? `Marked as read: ${sop.title}`
        : `บันทึกการอ่าน SOP: ${sop.title}`
    );
  };

  const handleSubmitQC = () => {
    if (!newQC.date || !newQC.instrument)
      return alert(
        lang === "en"
          ? "Please fill all fields."
          : "กรุณากรอกข้อมูลให้ครบถ้วน"
      );
    setQcRecords((prev) => [newQC, ...prev]);
    alert(lang === "en" ? "QC record submitted" : "บันทึก QC แล้ว");
    setNewQC({ date: "", instrument: "", result: "Pass", note: "" });
  };

  const handleUploadDoc = () => {
    const newDoc: QCDoc = {
      id: `QC-${String(qcDocs.length + 1).padStart(3, "0")}`,
      name: "New QC Document (mock)",
      type: "Validation",
      uploaded: new Date().toISOString().split("T")[0],
    };
    setQcDocs((p) => [...p, newDoc]);
    alert(lang === "en" ? "Mock file uploaded" : "อัปโหลดไฟล์จำลองแล้ว");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {lang === "en"
          ? "QC & Training"
          : "ควบคุมคุณภาพและอบรม (QC & Training)"}
      </h1>
      <p className={styles.subtitle}>
        {lang === "en"
          ? "Manage SOPs, QC records, and staff training logs."
          : "จัดการเอกสารคุณภาพ การบันทึก QC และบันทึกการอบรมบุคลากร"}
      </p>

      {/* SOP Repository */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <BookOpen size={18} />{" "}
          {lang === "en" ? "SOP Repository" : "คลัง SOP"}
        </h2>

        <div className={styles.searchBar}>
          <input
            className={styles.input}
            placeholder={lang === "en" ? "Search SOP..." : "ค้นหา SOP..."}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddSOP}>
            <Plus size={16} /> {lang === "en" ? "Add SOP" : "เพิ่ม SOP"}
          </button>
        </div>

        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>{lang === "en" ? "Title" : "ชื่อเรื่อง"}</th>
                <th>{lang === "en" ? "Version" : "เวอร์ชัน"}</th>
                <th>{lang === "en" ? "Status" : "สถานะ"}</th>
                <th>{lang === "en" ? "Last review" : "วันที่ทบทวน"}</th>
                <th>{lang === "en" ? "Actions" : "การทำงาน"}</th>
              </tr>
            </thead>
            <tbody>
              {sops
                .filter((s) =>
                  s.title.toLowerCase().includes(filter.toLowerCase())
                )
                .map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.title}</td>
                    <td>{s.version}</td>
                    <td>{s.status}</td>
                    <td>{s.lastReview}</td>
                    <td>
                      <button className={`${styles.btn} ${styles.btnGhost}`}>
                        <FileText size={14} /> Open
                      </button>{" "}
                      <button className={`${styles.btn} ${styles.btnPrimary}`}>
                        <DownloadIcon /> PDF
                      </button>{" "}
                      <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => handleMarkRead(s)}
                      >
                        <Check size={14} />{" "}
                        {lang === "en" ? "Mark Read" : "บันทึกการอ่าน"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily QC Record */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <ClipboardCheck size={18} />{" "}
          {lang === "en" ? "Daily QC Record" : "บันทึก QC ประจำวัน"}
        </h2>

        <div className={styles.formGrid}>
          <input
            type="date"
            className={styles.input}
            value={newQC.date}
            onChange={(e) => setNewQC({ ...newQC, date: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder={lang === "en" ? "Instrument" : "ชื่ออุปกรณ์"}
            value={newQC.instrument}
            onChange={(e) => setNewQC({ ...newQC, instrument: e.target.value })}
          />
          <select
            className={styles.select}
            value={newQC.result}
            onChange={(e) =>
              setNewQC({ ...newQC, result: e.target.value as "Pass" | "Fail" })
            }
          >
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
          <input
            className={styles.input}
            placeholder={lang === "en" ? "Note" : "หมายเหตุ"}
            value={newQC.note}
            onChange={(e) => setNewQC({ ...newQC, note: e.target.value })}
          />
        </div>

        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmitQC}>
          <Check size={16} /> {lang === "en" ? "Submit QC" : "บันทึก QC"}
        </button>

        {qcRecords.length > 0 && (
          <div className={styles.tableBox} style={{ marginTop: "1rem" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{lang === "en" ? "Date" : "วันที่"}</th>
                  <th>{lang === "en" ? "Instrument" : "อุปกรณ์"}</th>
                  <th>Result</th>
                  <th>{lang === "en" ? "Note" : "หมายเหตุ"}</th>
                </tr>
              </thead>
              <tbody>
                {qcRecords.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>{r.instrument}</td>
                    <td>{r.result}</td>
                    <td>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QC Documents */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Upload size={18} />{" "}
          {lang === "en" ? "QC Documents" : "เอกสารคุณภาพ"}
        </h2>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleUploadDoc}>
          <Upload size={16} /> {lang === "en" ? "Attach file" : "แนบไฟล์"}
        </button>

        <div className={styles.tableBox} style={{ marginTop: "1rem" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>{lang === "en" ? "Document" : "ชื่อเอกสาร"}</th>
                <th>{lang === "en" ? "Type" : "ประเภท"}</th>
                <th>{lang === "en" ? "Uploaded" : "วันที่อัปโหลด"}</th>
              </tr>
            </thead>
            <tbody>
              {qcDocs.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.name}</td>
                  <td>{d.type}</td>
                  <td>{d.uploaded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Training Log */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FileText size={18} />{" "}
          {lang === "en" ? "Training Log" : "บันทึกการอบรม"}
        </h2>
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{lang === "en" ? "Staff" : "บุคลากร"}</th>
                <th>SOP</th>
                <th>{lang === "en" ? "Date" : "วันที่"}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {training.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    {lang === "en"
                      ? "No training logs yet."
                      : "ยังไม่มีบันทึกการอบรม"}
                  </td>
                </tr>
              ) : (
                training.map((t) => (
                  <tr key={t.id}>
                    <td>{t.staff}</td>
                    <td>{t.sop}</td>
                    <td>{t.date}</td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          t.status === "Done"
                            ? styles.statusDone
                            : styles.statusPending
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* helper icon for download */
function DownloadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
