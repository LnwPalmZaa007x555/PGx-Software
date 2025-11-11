"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import styles from "./page.module.css";
import { fetchPatients, type PatientDto } from "@/utils/patients";
import { listResultsForPatient, type ResultRow } from "@/utils/results";
import { fetchGeneNameByIdMap } from "@/utils/gene";
import { useLanguage } from "@/context/LanguageContext";

export default function PatientHistoryPage() {
  const { id } = useParams(); // idCard
  const router = useRouter();
  const { language } = useLanguage();

  const [patient, setPatient] = useState<PatientDto | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  // removed unused count state (not displayed)
  const [geneMap, setGeneMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // 1) find patient by idCard
        const pts = await fetchPatients();
        const p = pts.find((x) => x.Id_Card === id);
        if (!p) {
          setError("Patient not found");
          setLoading(false);
          return;
        }
        setPatient(p);
        // 2) fetch gene map and results
        const [gmap, res] = await Promise.all([
          fetchGeneNameByIdMap(),
          listResultsForPatient(p.Patient_Id, 100, 0),
        ]);
  setGeneMap(gmap);
  setResults(res.items || []);
      } catch (e: unknown) {
        const apiErr = (e as { response?: { data?: { error?: unknown } } }).response?.data?.error;
        const msg = typeof apiErr === "string" ? apiErr : e instanceof Error ? e.message : "Failed to load";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const rows = useMemo(() => {
    return (results || []).map((r) => ({
      id: r.Result_Id,
      gene: geneMap[r.gene_id] || String(r.gene_id),
      status: r.status,
      requested: r.Requested_date,
      reported: r.Reported_date,
    }));
  }, [results, geneMap]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.button} onClick={() => router.push(`/case/${id}`)}>
          <ArrowLeft size={16} /> {language === "en" ? "Back" : "ย้อนกลับ"}
        </button>
      </div>

      <h1 className={styles.title}>
        <History size={18} style={{ marginRight: 6 }} />
        {language === "en" ? "Patient History" : "ประวัติผลผู้ป่วย"}
      </h1>
      <p className={styles.subtitle}>
        {patient
          ? `${patient.Fname} ${patient.Lname} • HN: ${patient.Id_Card}`
          : language === "en" ? "Loading patient..." : "กำลังโหลดผู้ป่วย..."}
      </p>

      {loading ? (
        <p>{language === "en" ? "Loading..." : "กำลังโหลด..."}</p>
      ) : error ? (
        <p style={{ color: "#b91c1c" }}>{error}</p>
      ) : rows.length === 0 ? (
        <p>{language === "en" ? "No results found." : "ยังไม่มีประวัติผล"}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{language === "en" ? "Result ID" : "เลขผล"}</th>
              <th>{language === "en" ? "Gene" : "ยีน"}</th>
              <th>{language === "en" ? "Status" : "สถานะ"}</th>
              <th>{language === "en" ? "Requested" : "วันที่ขอ"}</th>
              <th>{language === "en" ? "Reported" : "วันที่รายงาน"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.gene}</td>
                <td>
                  <span className={`${styles.badge} ${r.status === "rejected" ? styles.badgeRejected : styles.badgeCompleted}`}>
                    {r.status}
                  </span>
                </td>
                <td>{r.requested ? new Date(r.requested).toLocaleString() : "-"}</td>
                <td>{r.reported ? new Date(r.reported).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
