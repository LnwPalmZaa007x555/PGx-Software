"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  QrCode,
  FileSearch,
  Check,
  X,
  Printer,
  Upload,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import QRCode from "react-qr-code";
import styles from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";

/** Types */
interface Patient {
  idCard: string; // ใช้แทน HN/ID
  firstName: string;
  lastName: string;
  status?: string;
}

interface SpecimenItem {
  type: string;
  minVolume: string;
  container: string;
  temperature: string;
  rejection: string;
  custody: string;
}

type AccessionStatus = "accepted" | "rejected";

interface AccessionLogEntry {
  id: string; // uuid-like
  accessionId: string;
  patientId: string;
  patientName: string;
  specimenType: string;
  status: AccessionStatus;
  reason?: string;
  receiver: string;
  timestamp: string; // ISO
  attachments: string[]; // file names (mock)
}

/** Utils */
const fmtDateTime = (iso: string, lang: "th" | "en") => {
  const d = new Date(iso);
  return d.toLocaleString(lang === "en" ? "en-US" : "th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const generateAccessionId = () => {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const t = String(now.getTime()).slice(-5);
  return `ACC-${y}${m}${d}-${t}`;
};

const uid = () => Math.random().toString(36).slice(2, 10);

/** Component */
export default function SpecimenPage() {
  const { language } = useLanguage(); // "th" | "en"
  const lang = (language as "th" | "en") ?? "th";

  // ---- Mock role check (lab-only) ----
  const userRole = "lab"; // เปลี่ยนค่าเพื่อทดสอบ: "viewer"
  if (userRole !== "lab") {
    return (
      <div className={styles.container}>
        <div className={styles.section}>
          <div className={styles.banner}>
            <ShieldCheck size={18} />
            <strong>
              {lang === "en"
                ? "Access restricted."
                : "จำกัดสิทธิ์การเข้าถึง"}
            </strong>
            <span>
              {lang === "en"
                ? "This page is for Lab Staff only."
                : "หน้านี้อนุญาตเฉพาะเจ้าหน้าที่ห้องปฏิบัติการ"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ---- State ----
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [searchId, setSearchId] = useState("");
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [selectedSpecimenType, setSelectedSpecimenType] = useState<string>("");
  const [rejected, setRejected] = useState(false);

  const [rejectPreset, setRejectPreset] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [attachments, setAttachments] = useState<string[]>([]);

  const [logs, setLogs] = useState<AccessionLogEntry[]>([]);
  const [printing, setPrinting] = useState<AccessionLogEntry | null>(null);

  // ---- Mock initial data (patients & logs) ----
  useEffect(() => {
    // mock patients (from localStorage or seed)
    const stored = JSON.parse(localStorage.getItem("patients") || "[]");
    let base: Patient[] = stored;
    if (!Array.isArray(base) || base.length === 0) {
      base = [
        { idCard: "1103701234567", firstName: "Somchai", lastName: "K." },
        { idCard: "1739909876543", firstName: "Suda", lastName: "P." },
        { idCard: "1159901231234", firstName: "Anan", lastName: "T." },
      ];
      
      localStorage.setItem("patients", JSON.stringify(base));
    }
    // simulate loading
    setLoadingPatients(true);
    const timer = setTimeout(() => {
      setPatients(base);
      setLoadingPatients(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // ---- Catalog (static mock, bilingual) ----
  const catalog: SpecimenItem[] = useMemo(
    () => [
      {
        type: lang === "en" ? "Whole blood (EDTA)" : "เลือด (EDTA)",
        minVolume: "2 mL",
        container: lang === "en" ? "Purple cap tube" : "หลอดฝาม่วง",
        temperature: "2–8°C",
        rejection:
          lang === "en"
            ? "Hemolyzed, clotted, insufficient volume"
            : "สลายตัว/มีลิ่มเลือด/ปริมาณไม่พอ",
        custody:
          lang === "en"
            ? "Accession ID, timestamp, receiver signature"
            : "รหัสรับสิ่งส่งตรวจ, เวลา, ผู้รับ",
      },
      {
        type: lang === "en" ? "Buccal swab" : "Swab กระพุ้งแก้ม",
        minVolume: lang === "en" ? "2 swabs" : "2 ไม้",
        container: lang === "en" ? "Swab tube" : "หลอดเก็บ swab",
        temperature: "RT",
        rejection:
          lang === "en" ? "Contaminated or dry swab" : "ปนเปื้อน/แห้ง",
        custody:
          lang === "en"
            ? "Linked to accession batch with tracking"
            : "เชื่อมกับชุดรับสิ่งส่งตรวจในระบบติดตาม",
      },
      {
        type: lang === "en" ? "Saliva kit" : "น้ำลาย (Saliva kit)",
        minVolume: lang === "en" ? "As per kit" : "ตามชุดตรวจ",
        container: lang === "en" ? "Saliva vial" : "หลอดเก็บน้ำลาย",
        temperature: "RT / 2–8°C",
        rejection:
          lang === "en"
            ? "Leaking, unlabeled, expired"
            : "รั่ว/ไม่มีฉลาก/หมดอายุ",
        custody:
          lang === "en"
            ? "Documented handover to Lab"
            : "บันทึกการส่งมอบถึงแล็บ",
      },
    ],
    [lang]
  );

  // ---- Search patient ----
  const handleSearch = () => {
    if (!searchId) return;
    setLoadingSearch(true);
    setFoundPatient(null);
    setRejected(false);
    setRejectPreset("");
    setRejectReason("");
    setAttachments([]);
    setSelectedSpecimenType(catalog[0]?.type ?? "");

    setTimeout(() => {
      const found = patients.find((p) => p.idCard === searchId);
      setFoundPatient(found || null);
      setLoadingSearch(false);
    }, 500);
  };

  // ---- Accept / Reject ----
  const currentReceiver =
    lang === "en" ? "Lab Staff (mock)" : "เจ้าหน้าที่แล็บ (จำลอง)";

  const acceptSpecimen = () => {
    if (!foundPatient) return;
    if (!selectedSpecimenType) {
      alert(
        lang === "en"
          ? "Please select specimen type."
          : "กรุณาเลือกชนิดสิ่งส่งตรวจ"
      );
      return;
    }

    const entry: AccessionLogEntry = {
      id: uid(),
      accessionId: generateAccessionId(),
      patientId: foundPatient.idCard,
      patientName: `${foundPatient.firstName} ${foundPatient.lastName}`,
      specimenType: selectedSpecimenType,
      status: "accepted",
      receiver: currentReceiver,
      timestamp: new Date().toISOString(),
      attachments,
    };

    setLogs((prev) => [entry, ...prev]);
    alert(
      lang === "en"
        ? "✅ Specimen accepted and logged."
        : "✅ รับสิ่งส่งตรวจเรียบร้อยแล้ว"
    );

    // reset search box but keep last patient for print
    setPrinting(entry);
    setFoundPatient(null);
    setSearchId("");
    setRejected(false);
    setRejectPreset("");
    setRejectReason("");
    setAttachments([]);
  };

  const rejectSpecimen = () => {
    if (!foundPatient) return;
    const reason =
      rejectPreset === "other" ? rejectReason.trim() : rejectPreset;

    if (!reason) {
      alert(
        lang === "en"
          ? "Please specify the rejection reason."
          : "กรุณาระบุเหตุผลการปฏิเสธ"
      );
      return;
    }

    const entry: AccessionLogEntry = {
      id: uid(),
      accessionId: generateAccessionId(),
      patientId: foundPatient.idCard,
      patientName: `${foundPatient.firstName} ${foundPatient.lastName}`,
      specimenType: selectedSpecimenType || "-",
      status: "rejected",
      reason,
      receiver: currentReceiver,
      timestamp: new Date().toISOString(),
      attachments,
    };

    setLogs((prev) => [entry, ...prev]);
    alert(
      lang === "en"
        ? `❌ Specimen rejected: ${reason}`
        : `❌ ปฏิเสธสิ่งส่งตรวจ: ${reason}`
    );

    setFoundPatient(null);
    setSearchId("");
    setRejected(false);
    setRejectPreset("");
    setRejectReason("");
    setAttachments([]);
  };

  // ---- Attachments (mock) ----
  const onFileAttach = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setAttachments((prev) => [...prev, ...names]);
  };

  // ---- Stats (today only) ----
  const today = todayKey();
  const stats = useMemo(() => {
    const todayLogs = logs.filter((l) => {
      const d = new Date(l.timestamp);
      return (
        d.getFullYear() === new Date().getFullYear() &&
        d.getMonth() === new Date().getMonth() &&
        d.getDate() === new Date().getDate()
      );
    });
    const accepted = todayLogs.filter((l) => l.status === "accepted").length;
    const rejectedCount = todayLogs.filter((l) => l.status === "rejected").length;
    return { accepted, rejected: rejectedCount, total: todayLogs.length };
  }, [logs]);

  // ---- Print barcode (mock in new window) ----
  const handlePrint = (entry: AccessionLogEntry) => {
    const w = window.open("", "_blank", "width=480,height=600");
    if (!w) return;
    const title = lang === "en" ? "Accession Slip" : "ใบรรับสิ่งส่งตรวจ";
    const labelText = lang === "en" ? "Accession ID" : "รหัสรับสิ่งส่งตรวจ";
    const patientText = lang === "en" ? "Patient" : "ผู้ป่วย";
    const specText = lang === "en" ? "Specimen" : "ชนิดสิ่งส่งตรวจ";
    const timeText = lang === "en" ? "Received at" : "เวลารับเข้า";
    const recvText = lang === "en" ? "Receiver" : "ผู้รับ";

    // very small inline print page
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h1 { font-size: 16px; margin: 0 0 8px; }
            .row { margin-bottom: 6px; font-size: 12px; }
            .qr { margin: 12px 0; display:flex; gap: 12px; align-items:center; }
            .badge { padding: 2px 8px; border:1px solid #0a0; border-radius: 999px; color:#074; font-weight:700; font-size:11px;}
            .print { margin-top: 12px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="row"><strong>${labelText}:</strong> ${entry.accessionId}</div>
          <div class="row"><strong>${patientText}:</strong> ${entry.patientName} (${entry.patientId})</div>
          <div class="row"><strong>${specText}:</strong> ${entry.specimenType}</div>
          <div class="row"><strong>${timeText}:</strong> ${fmtDateTime(entry.timestamp, lang)}</div>
          <div class="row"><strong>${recvText}:</strong> ${entry.receiver}</div>
          <div class="qr">
            <div id="qrcode"></div>
            <span class="badge">PGx</span>
          </div>
          <script>
            // minimal QR (fallback): render text if lib not present
            document.getElementById('qrcode').innerText = '${entry.accessionId}';
          </script>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  // ---- UI ----
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {lang === "en"
          ? "Specimen Accessioning"
          : "รับสิ่งส่งตรวจ (Specimen Accessioning)"}
      </h1>
      <p className={styles.subtitle}>
        {lang === "en"
          ? "Record and verify specimen acceptance"
          : "บันทึกและตรวจสอบการรับสิ่งส่งตรวจ"}
      </p>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            {lang === "en" ? "Received today" : "รับเข้า (วันนี้)"}
          </div>
          <div className={styles.statValue}>{stats.accepted}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            {lang === "en" ? "Rejected today" : "ปฏิเสธ (วันนี้)"}
          </div>
          <div className={styles.statValue}>{stats.rejected}</div>
        </div>
      </div>

      {/* Catalog */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {lang === "en" ? "Specimen Catalog" : "แค็ตตาล็อกสิ่งส่งตรวจ"}
        </h2>
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{lang === "en" ? "Type" : "ชนิดสิ่งส่งตรวจ"}</th>
                <th>{lang === "en" ? "Min Volume" : "ปริมาณขั้นต่ำ"}</th>
                <th>{lang === "en" ? "Container" : "ภาชนะ"}</th>
                <th>{lang === "en" ? "Temperature" : "อุณหภูมิขนส่ง"}</th>
                <th>{lang === "en" ? "Rejection Criteria" : "เกณฑ์การปฏิเสธ"}</th>
                <th>{lang === "en" ? "Chain of Custody" : "Chain-of-Custody"}</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((c, i) => (
                <tr key={i}>
                  <td>{c.type}</td>
                  <td>{c.minVolume}</td>
                  <td>{c.container}</td>
                  <td>{c.temperature}</td>
                  <td>{c.rejection}</td>
                  <td>{c.custody}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accessioning */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {lang === "en" ? "Specimen Accessioning" : "สแกนรับสิ่งส่งตรวจ"}
        </h2>

        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchId}
            onChange={(e) =>
              setSearchId(e.target.value.replace(/\D/g, "").slice(0, 13))
            }
            placeholder={
              lang === "en"
                ? "Scan or enter HN / ID (13 digits)"
                : "สแกนหรือกรอก HN / รหัสผู้ป่วย (13 หลัก)"
            }
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            {loadingSearch ? (
              <>
                <Loader2 size={16} className={styles.spin} />
                {lang === "en" ? "Searching..." : "กำลังค้นหา..."}
              </>
            ) : (
              <>
                <FileSearch size={18} />
                {lang === "en" ? "Search" : "ค้นหา"}
              </>
            )}
          </button>
        </div>

        {loadingPatients && (
          <div className={styles.loading}>
            <Loader2 size={16} className={styles.spin} />
            {lang === "en" ? "Loading patients..." : "กำลังโหลดข้อมูลผู้ป่วย..."}
          </div>
        )}

        {foundPatient ? (
          <div className={styles.resultBox}>
            <div className={styles.row}>
              <div>
                <div>
                  {lang === "en" ? "Patient" : "ผู้ป่วย"}:{" "}
                  <strong>
                    {foundPatient.firstName} {foundPatient.lastName}
                  </strong>{" "}
                  <span className={styles.badge}>HN: {foundPatient.idCard}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <label>
                    {lang === "en" ? "Specimen type" : "ชนิดสิ่งส่งตรวจ"}:{" "}
                  </label>
                  <select
                    className={styles.select}
                    value={selectedSpecimenType}
                    onChange={(e) => setSelectedSpecimenType(e.target.value)}
                  >
                    {catalog.map((c) => (
                      <option key={c.type} value={c.type}>
                        {c.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.qrBox}>
                <div>
                  <QRCode value={foundPatient.idCard} size={100} />
                </div>
                <div>
                  <div className={styles.badge}>
                    {lang === "en" ? "Chain-of-custody ready" : "พร้อมบันทึกการส่งมอบ"}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button
                      className={styles.uploadBtn}
                      onClick={() => {
                        const el = document.getElementById(
                          "attach-input"
                        ) as HTMLInputElement | null;
                        el?.click();
                      }}
                    >
                      <Upload size={16} />
                      {lang === "en" ? "Attach file/photo" : "แนบไฟล์/รูป"}
                    </button>
                    <input
                      id="attach-input"
                      type="file"
                      multiple
                      className={styles.file}
                      style={{ display: "none" }}
                      onChange={(e) => onFileAttach(e.target.files)}
                    />
                    {!!attachments.length && (
                      <div className={styles.attachList}>
                        {attachments.map((a) => (
                          <span key={a} className={styles.attachChip}>
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!rejected ? (
              <div className={styles.actions}>
                <button className={styles.acceptBtn} onClick={acceptSpecimen}>
                  <Check size={16} />
                  {lang === "en" ? "Accept specimen" : "รับสิ่งส่งตรวจ"}
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => setRejected(true)}
                >
                  <X size={16} />
                  {lang === "en" ? "Reject specimen" : "ปฏิเสธสิ่งส่งตรวจ"}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.rejectBox} style={{ marginTop: 8 }}>
                  <select
                    className={styles.select}
                    value={rejectPreset}
                    onChange={(e) => setRejectPreset(e.target.value)}
                  >
                    <option value="">
                      {lang === "en"
                        ? "Select rejection reason"
                        : "เลือกเหตุผลการปฏิเสธ"}
                    </option>
                    <option value={lang === "en" ? "Insufficient volume" : "ปริมาณไม่พอ"}>
                      {lang === "en" ? "Insufficient volume" : "ปริมาณไม่พอ"}
                    </option>
                    <option value={lang === "en" ? "Hemolyzed/clotted" : "ตัวอย่างสลาย/มีลิ่มเลือด"}>
                      {lang === "en" ? "Hemolyzed / clotted" : "ตัวอย่างสลาย/มีลิ่มเลือด"}
                    </option>
                    <option value={lang === "en" ? "Wrong container" : "ภาชนะไม่ถูกต้อง"}>
                      {lang === "en" ? "Wrong container" : "ภาชนะไม่ถูกต้อง"}
                    </option>
                    <option value={lang === "en" ? "Label mismatch" : "ฉลากไม่ตรงกับผู้ป่วย"}>
                      {lang === "en" ? "Label mismatch" : "ฉลากไม่ตรงกับผู้ป่วย"}
                    </option>
                    <option value={lang === "en" ? "Exceeded holding time" : "เกินเวลาการเก็บรักษา"}>
                      {lang === "en" ? "Exceeded holding time" : "เกินเวลาการเก็บรักษา"}
                    </option>
                    <option value="other">
                      {lang === "en" ? "Other (specify)" : "อื่น ๆ (ระบุ)"}
                    </option>
                  </select>

                  <input
                    className={styles.input}
                    placeholder={
                      lang === "en"
                        ? "Detail (if Other)"
                        : "ระบุรายละเอียด (ถ้าเลือก อื่น ๆ)"
                    }
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    disabled={rejectPreset !== "other"}
                  />

                  <div className={styles.actions}>
                    <button className={styles.rejectBtn} onClick={rejectSpecimen}>
                      <X size={16} />{" "}
                      {lang === "en" ? "Confirm reject" : "ยืนยันการปฏิเสธ"}
                    </button>
                    <button
                      className={styles.acceptBtn}
                      onClick={() => {
                        setRejected(false);
                        setRejectPreset("");
                        setRejectReason("");
                      }}
                    >
                      {lang === "en" ? "Cancel" : "ยกเลิก"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          searchId &&
          !loadingSearch && (
            <p className={styles.noResult}>
              {lang === "en" ? "No matching patient found." : "ไม่พบข้อมูลผู้ป่วยในระบบ"}
            </p>
          )
        )}
      </div>

      {/* Print last accepted */}
      {printing && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {lang === "en" ? "Print barcode / slip" : "พิมพ์บาร์โค้ด / ใบรับสิ่งส่งตรวจ"}
          </h2>
          <div className={styles.row}>
            <div className={styles.badge}>
              {lang === "en" ? "Last accepted:" : "รายการล่าสุด:"}{" "}
              {printing.accessionId}
            </div>
            <button className={styles.printBtn} onClick={() => handlePrint(printing)}>
              <Printer size={16} />
              {lang === "en" ? "Print" : "พิมพ์"}
            </button>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {lang === "en" ? "Recent Accessions" : "ประวัติการรับสิ่งส่งตรวจ"}
        </h2>
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{lang === "en" ? "Time" : "เวลา"}</th>
                <th>{lang === "en" ? "Accession ID" : "รหัสรับเข้า"}</th>
                <th>{lang === "en" ? "Patient" : "ผู้ป่วย"}</th>
                <th>{lang === "en" ? "Specimen" : "สิ่งส่งตรวจ"}</th>
                <th>{lang === "en" ? "Status" : "สถานะ"}</th>
                <th>{lang === "en" ? "Receiver" : "ผู้รับ"}</th>
                <th>{lang === "en" ? "Reason / Attachment" : "เหตุผล / ไฟล์แนบ"}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "#6b7280" }}>
                    {lang === "en"
                      ? "No logs yet. Accept or reject a specimen to see logs here."
                      : "ยังไม่มีข้อมูล ลองรับหรือปฏิเสธสิ่งส่งตรวจเพื่อแสดงข้อมูลที่นี่"}
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td>{fmtDateTime(l.timestamp, lang)}</td>
                    <td>{l.accessionId}</td>
                    <td>
                      {l.patientName}{" "}
                      <span className={styles.badge}>HN: {l.patientId}</span>
                    </td>
                    <td>{l.specimenType}</td>
                    <td>
                      {l.status === "accepted" ? (
                        <span className={styles.statusAccepted}>
                          {lang === "en" ? "Accepted" : "รับเข้าแล้ว"}
                        </span>
                      ) : (
                        <span className={styles.statusRejected}>
                          {lang === "en" ? "Rejected" : "ปฏิเสธ"}
                        </span>
                      )}
                    </td>
                    <td>{l.receiver}</td>
                    <td>
                      {l.status === "rejected" ? (
                        <div style={{ marginBottom: 6 }}>
                          <strong>
                            {lang === "en" ? "Reason:" : "เหตุผล:"}
                          </strong>{" "}
                          {l.reason}
                        </div>
                      ) : null}
                      {l.attachments.length > 0 && (
                        <div className={styles.attachList}>
                          {l.attachments.map((a) => (
                            <span key={a} className={styles.attachChip}>
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
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
