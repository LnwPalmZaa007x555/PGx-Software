"use client";

import { useEffect, useMemo, useState } from "react";
// import { usePatients } from "@/context/PatientContext"; // replaced by axios fetching
import { genotypeMappings } from "@/utils/mappings";
import { Search, Dna, Save } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./page.module.css";
import { fetchPatients, type PatientDto, updatePatientById } from "@/utils/patients";
import { saveGeneResult, type GeneKey } from "@/utils/gene";

type MarkerValues = Record<string, string>;

type PatientRow = {
  recordId: number;
  idCard: string;
  firstName: string;
  lastName: string;
  sex: string;
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
      sex: (p.Gender || "").toLowerCase(),
      phone: p.Phone,
      ethnicity: isThai ? "thai" : "other",
      otherEthnicity: isThai ? undefined : p.Ethnicity,
      status: mapStatus(p.status || ""),
    };
  });
}

export default function GenePage() {
  // const { patients, updatePatients } = usePatients();
  const { language } = useLanguage();

  const [searchId, setSearchId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [gene, setGene] = useState<GeneKey | "">("");
  const [markerValues, setMarkerValues] = useState<MarkerValues>({});
  const [genotype, setGenotype] = useState("");
  const [phenotype, setPhenotype] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patientList, setPatientList] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  // load errors surfaced via alert; dedicated state removed

  useEffect(() => {
    (async () => {
      try {
        const items = await fetchPatients();
        setPatientList(toRows(items));
      } catch (e: unknown) {
        const apiErr = (e as { response?: { data?: { error?: unknown } } }).response?.data?.error;
        const msg = typeof apiErr === "string" ? apiErr : e instanceof Error ? e.message : "Failed to load patients";
        alert(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🧠 Filter pending patients
  const pendingPatients = useMemo(() => {
    const list = patientList.filter(
      (p) =>
        p.status === "pending_gene" &&
        (p.idCard || "").includes(searchId.trim())
    );
    return list.slice().reverse();
  }, [patientList, searchId]);

  // 🔘 Select Patient
  const handleSelectPatient = (idCard: string) => {
    if (selectedId === idCard) {
      setSelectedId(null);
      setSelectedRecordId(null);
      setGene("");
      setMarkerValues({});
      setGenotype("");
      setPhenotype("");
      setRecommendation("");
      setErrors({});
      return;
    }
    setSelectedId(idCard);
    const row = patientList.find(p => p.idCard === idCard) || null;
    setSelectedRecordId(row ? row.recordId : null);
    setGene("");
    setMarkerValues({});
    setGenotype("");
    setPhenotype("");
    setRecommendation("");
    setErrors({});
  };

  const areAllMarkersSelected = (geneKey: string, values: MarkerValues) => {
    const gm = genotypeMappings[geneKey as keyof typeof genotypeMappings];
    if (!gm) return false;
    return gm.markers.every((m) => values[m.name]);
  };

  // 🧬 Marker Change
  const handleMarkerChange = (markerName: string, value: string) => {
    const next = { ...markerValues, [markerName]: value };
    setMarkerValues(next);

    if (gene && areAllMarkersSelected(gene, next)) {
      const gm = genotypeMappings[gene as keyof typeof genotypeMappings];
      const computedGenotype = gm.mapToGenotype(next) || "";
      const found = gm.genotypes.find((g) => g.genotype === computedGenotype);

      setGenotype(computedGenotype);

      // ✅ ตรวจภาษา
      const pheno =
        language === "en"
          ? found?.phenotype_en || found?.phenotype || ""
          : found?.phenotype_th || found?.phenotype || "";
      const reco =
        language === "en"
          ? found?.recommendation_en || found?.recommendation || ""
          : found?.recommendation_th || found?.recommendation || "";

      setPhenotype(pheno);
      setRecommendation(reco);
    } else {
      setGenotype("");
      setPhenotype("");
      setRecommendation("");
    }
  };

  // ✅ Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedId)
      newErrors.patient =
        language === "en"
          ? "Please select a patient"
          : "กรุณาเลือกผู้ป่วย";
    if (!gene)
      newErrors.gene =
        language === "en"
          ? "Please select a gene"
          : "กรุณาเลือกยีน";

    if (gene) {
      const gm = genotypeMappings[gene as keyof typeof genotypeMappings];
      gm.markers.forEach((m) => {
        if (!markerValues[m.name])
          newErrors[m.name] =
            language === "en"
              ? `Please select ${m.name}`
              : `กรุณาเลือก ${m.name}`;
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

  // phenotype & recommendation already derived during marker changes; no extra computation needed here

    try {
      // 1) Save to Result via backend gene endpoint
      if (!gene) throw new Error("Gene is required");
      if (selectedRecordId == null) throw new Error("No patient selected");

  await saveGeneResult(gene as GeneKey, selectedRecordId, markerValues);

      // 2) Update Patient status to Pending approval
      await updatePatientById(selectedRecordId, { status: "Pending approval" });
      setPatientList(prev => prev.map(p => p.recordId === selectedRecordId ? { ...p, status: "pending_approve" } : p));

      alert(
        language === "en"
          ? "✅ Gene information saved successfully!"
          : "✅ บันทึกข้อมูลยีนสำเร็จแล้ว!"
      );

      setSelectedId(null);
      setSelectedRecordId(null);
      setGene("");
      setMarkerValues({});
      setGenotype("");
      setPhenotype("");
      setRecommendation("");
    } catch (err: unknown) {
      const apiErr = (err as { response?: { data?: { error?: unknown } } }).response?.data?.error;
      const msg = typeof apiErr === "string" ? apiErr : err instanceof Error ? err.message : (language === "en" ? "Save failed" : "บันทึกล้มเหลว");
      alert(msg);
    }
  };

  // ---------------- Render ----------------
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {language === "en" ? "Gene Entry" : "กรอกข้อมูลยีน"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Manage and record genetic data for pending patients."
          : "จัดการและบันทึกข้อมูลยีนสำหรับผู้ป่วยที่รอกรอก"}
      </p>

      <div className={styles.grid}>
        <div className={styles.left}>
          {/* Pending Patients */}
          <div className={styles.chartBox}>
            <h3>
              <Dna size={18} color="#4CA771" style={{ marginRight: 6 }} />
              {language === "en" ? "Pending Patients" : "ผู้ป่วยที่รอกรอกยีน"}
            </h3>
            <p className={styles.sectionNote}>
              {language === "en"
                ? "Select a patient to fill their genetic information."
                : "เลือกผู้ป่วยเพื่อกรอกข้อมูลยีน"}
            </p>

            {/* Search */}
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

            {loading ? (
              <p>Loading…</p>
            ) : pendingPatients.length === 0 ? (
              <p>
                {language === "en"
                  ? "No pending patients found."
                  : "ไม่พบผู้ป่วยที่รอกรอกข้อมูล"}
              </p>
            ) : (
              <div className={styles.scrollBox}>
                {pendingPatients.map((p) => (
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
                          ? p.status?.replace("_", " ")
                          : p.status === "pending_gene"
                          ? "รอกรอกยีน"
                          : p.status === "pending_approve"
                          ? "รออนุมัติ"
                          : "อนุมัติแล้ว"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gene Entry Form */}
          {selectedId && (
            <form onSubmit={handleSubmit} className={styles.chartBox}>
              <h3>
                {language === "en"
                  ? "Genetic Information"
                  : "ข้อมูลทางพันธุกรรม"}
              </h3>
              <p className={styles.sectionNote}>
                {language === "en"
                  ? "Enter genetic markers and phenotypic interpretations."
                  : "กรอกข้อมูล marker ทางพันธุกรรมและการแปลผลฟีโนไทป์"}
              </p>

              {/* Select Gene */}
              <div className={styles.field}>
                <label className={styles.label}>
                  {language === "en" ? "Select Gene" : "เลือกยีน"}
                </label>
                <select
                  className={`${styles.input} ${
                    errors.gene ? styles.errorInput : ""
                  }`}
                  value={gene}
                  onChange={(e) => {
                    setGene(e.target.value as GeneKey | "");
                    setMarkerValues({});
                    setGenotype("");
                    setPhenotype("");
                    setErrors((prev) => ({ ...prev, gene: "" }));
                  }}
                >
                  <option value="">
                    {language === "en" ? "-- Select Gene --" : "-- เลือกยีน --"}
                  </option>
                  {Object.keys(genotypeMappings).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {errors.gene && <span className={styles.error}>{errors.gene}</span>}
              </div>

              {/* Marker Options */}
              {gene &&
                genotypeMappings[gene as keyof typeof genotypeMappings].markers.map(
                  (marker) => (
                    <div key={marker.name} className={styles.field}>
                      <label className={styles.label}>
                        {marker.name} {marker.description}
                      </label>
                      <select
                        className={`${styles.input} ${
                          errors[marker.name] ? styles.errorInput : ""
                        }`}
                        value={markerValues[marker.name] || ""}
                        onChange={(e) =>
                          handleMarkerChange(marker.name, e.target.value)
                        }
                      >
                        <option value="">
                          {language === "en" ? "-- Select --" : "-- เลือก --"}
                        </option>
                        {marker.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {errors[marker.name] && (
                        <span className={styles.error}>{errors[marker.name]}</span>
                      )}
                    </div>
                  )
                )}

              {/* Genotype/Phenotype/Recommendation */}
              {genotype && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    {language === "en" ? "Genotype" : "จีโนไทป์"}
                  </label>
                  <input className={styles.input} value={genotype} disabled />
                </div>
              )}

              {phenotype && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    {language === "en" ? "Phenotype" : "ฟีโนไทป์"}
                  </label>
                  <input className={styles.input} value={phenotype} disabled />
                </div>
              )}

              {recommendation && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    {language === "en" ? "Recommendation" : "คำแนะนำ"}
                  </label>
                  <input className={styles.input} value={recommendation} disabled />
                </div>
              )}

              <div className={styles.actions}>
                <button type="submit" className={styles.button}>
                  <Save size={18} style={{ marginRight: 6 }} />
                  {language === "en" ? "Save Gene Data" : "บันทึกข้อมูลยีน"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
