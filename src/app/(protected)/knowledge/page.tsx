"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  Shield,
  ShieldAlert,
  FlaskConical,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react";
import styles from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";

/** Types */
type Lang = "th" | "en";

interface TestInfo {
  code: string;
  nameTh: string;
  nameEn: string;
  specimen: string;
  volume: string;
  tat: string;
  pdfFile: string; // mock
}

interface CDSRule {
  gene: string;
  genotype: string;
  phenotypeTh: string;
  phenotypeEn: string;
  recommendationTh: string;
  recommendationEn: string;
  reference: string; // mock link text
}

interface HLAAlert {
  hla: string;
  drug: string;
  noteTh: string;
  noteEn: string;
}

interface DoseGuide {
  drug: string;
  genotype: string;
  recommendationTh: string;
  recommendationEn: string;
  commentTh?: string;
  commentEn?: string;
}

interface Article {
  id: string;
  titleTh: string;
  titleEn: string;
  kind: "Clinical" | "Research" | "Funding";
  authors: string;
  year: number;
  source: string;
  file?: string; // mock pdf
}

/** Mock data */
const TESTS: TestInfo[] = [
  {
    code: "PGX-CYP2C19",
    nameTh: "CYP2C19 (Clopidogrel/PPIs)",
    nameEn: "CYP2C19 (Clopidogrel/PPIs)",
    specimen: "Whole blood (EDTA)",
    volume: "2 mL",
    tat: "3–5 days",
    pdfFile: "PGX-CYP2C19-req.pdf",
  },
  {
    code: "PGX-CYP2D6",
    nameTh: "CYP2D6 (Codeine/Tamoxifen)",
    nameEn: "CYP2D6 (Codeine/Tamoxifen)",
    specimen: "Whole blood (EDTA) / Buccal swab",
    volume: "2 mL / 2 swabs",
    tat: "5–7 days",
    pdfFile: "PGX-CYP2D6-req.pdf",
  },
  {
    code: "HLA-B*15:02",
    nameTh: "HLA-B*15:02 (Carbamazepine)",
    nameEn: "HLA-B*15:02 (Carbamazepine)",
    specimen: "Whole blood (EDTA)",
    volume: "2 mL",
    tat: "2–3 days",
    pdfFile: "HLA-B1502-req.pdf",
  },
];

const CDS: CDSRule[] = [
  {
    gene: "CYP2C19",
    genotype: "*2/*2",
    phenotypeTh: "Poor metabolizer",
    phenotypeEn: "Poor metabolizer",
    recommendationTh: "หลีกเลี่ยง clopidogrel; พิจารณา prasugrel/ticagrelor",
    recommendationEn: "Avoid clopidogrel; consider prasugrel/ticagrelor",
    reference: "CPIC v5.1; PharmGKB",
  },
  {
    gene: "CYP2C19",
    genotype: "*1/*17",
    phenotypeTh: "Rapid metabolizer",
    phenotypeEn: "Rapid metabolizer",
    recommendationTh: "ใช้ clopidogrel ขนาดมาตรฐานได้",
    recommendationEn: "Use standard clopidogrel dose",
    reference: "CPIC v5.1",
  },
  {
    gene: "CYP2D6",
    genotype: "*4/*5",
    phenotypeTh: "Poor metabolizer",
    phenotypeEn: "Poor metabolizer",
    recommendationTh: "หลีกเลี่ยง codeine; พิจารณา morphine",
    recommendationEn: "Avoid codeine; consider morphine",
    reference: "CPIC v2.2",
  },
];

const HLA_ALERTS: HLAAlert[] = [
  {
    hla: "HLA-B*15:02",
    drug: "Carbamazepine",
    noteTh: "เสี่ยง SJS/TEN สูง: หลีกเลี่ยงยานี้",
    noteEn: "High risk of SJS/TEN: avoid this drug",
  },
  {
    hla: "HLA-B*58:01",
    drug: "Allopurinol",
    noteTh: "เสี่ยง SCAR: หลีกเลี่ยง/เฝ้าระวังอย่างใกล้ชิด",
    noteEn: "Risk of SCAR: avoid/monitor closely",
  },
];

const DOSE_GUIDES: DoseGuide[] = [
  {
    drug: "Warfarin",
    genotype: "VKORC1 -1639 G>A / CYP2C9 *1/*3",
    recommendationTh: "เริ่มขนาดต่ำ (เช่น 2–3 mg/day) และติดตาม INR ถี่",
    recommendationEn: "Start lower dose (e.g., 2–3 mg/day), monitor INR closely",
  },
  {
    drug: "Tacrolimus",
    genotype: "CYP3A5 *1/*3",
    recommendationTh: "ต้องใช้ขนาดสูงกว่าเพื่อให้ได้ trough level เป้าหมาย",
    recommendationEn: "Higher dose required to achieve target trough level",
  },
];

const ARTICLES: Article[] = [
  {
    id: "a1",
    titleTh: "แนวทาง CPIC: CYP2C19 กับ Clopidogrel",
    titleEn: "CPIC Guideline: CYP2C19 & Clopidogrel",
    kind: "Clinical",
    authors: "Smith et al.",
    year: 2023,
    source: "CPIC",
    file: "cpic-cyp2c19.pdf",
  },
  {
    id: "a2",
    titleTh: "การศึกษาความชุก HLA-B*15:02 ในเอเชียตะวันออกเฉียงใต้",
    titleEn: "Prevalence of HLA-B*15:02 in Southeast Asia",
    kind: "Research",
    authors: "Chan et al.",
    year: 2022,
    source: "PharmGKB",
  },
  {
    id: "a3",
    titleTh: "ทุนวิจัย PGx สำหรับโรงพยาบาลระดับอำเภอ",
    titleEn: "Funding for PGx programs in district hospitals",
    kind: "Funding",
    authors: "Health Innovation Agency",
    year: 2024,
    source: "HIA",
    file: "pgx-funding.pdf",
  },
];

/** Helpers */
const t = (lang: Lang) => ({
  pageTitle: lang === "en" ? "Knowledge & Info" : "คลังข้อมูล (Knowledge & Info)",
  pageDesc:
    lang === "en"
      ? "Central hub for test information, CDS rules, and articles."
      : "ศูนย์รวมข้อมูลบริการตรวจ กฎการแปลผล และบทความความรู้",
  bannerTitle: lang === "en" ? "Knowledge Hub mode" : "โหมดคลังข้อมูล",
  mockBadge: lang === "en" ? "Mock only (no API)" : "จำลองเท่านั้น (ไม่เชื่อม API)",

  s1: lang === "en" ? "Test Information" : "ข้อมูลบริการตรวจ",
  columnsTest: {
    code: lang === "en" ? "Code" : "รหัส",
    name: lang === "en" ? "Test name" : "ชื่อการตรวจ",
    specimen: lang === "en" ? "Specimen" : "ชนิดสิ่งส่งตรวจ",
    volume: lang === "en" ? "Volume" : "ปริมาณ",
    tat: lang === "en" ? "TAT (SLA)" : "TAT (SLA)",
    dl: lang === "en" ? "Download form (PDF)" : "ดาวน์โหลดใบสั่งตรวจ (PDF)",
  },

  s2: lang === "en" ? "CDS Rules" : "กฎการแปลผล (CDS Rules)",
  columnsCDS: {
    gene: "Gene",
    genotype: "Genotype",
    pheno: lang === "en" ? "Predicted phenotype" : "Predicted phenotype",
    rec: lang === "en" ? "Recommendation" : "คำแนะนำ",
    ref: lang === "en" ? "Reference" : "อ้างอิง",
  },

  s3: lang === "en" ? "HLA–Drug Alerts" : "รายการเตือนความเสี่ยง HLA–ยา",

  s4: lang === "en" ? "Dose Adjustment Guides" : "คำแนะนำการปรับขนาดยา",
  columnsDose: {
    drug: lang === "en" ? "Drug" : "ยา",
    genotype: "Genotype",
    rec: lang === "en" ? "Recommended dose" : "คำแนะนำ",
    note: lang === "en" ? "Comment" : "หมายเหตุ",
  },

  s5: lang === "en" ? "Knowledge Articles" : "บทความและงานวิจัย",
  searchPH: lang === "en" ? "Search title/author..." : "ค้นหาชื่อเรื่อง/ผู้เขียน...",
  filterAll: lang === "en" ? "All types" : "ทุกประเภท",
  openPDF: lang === "en" ? "Open PDF" : "เปิดไฟล์ PDF",
  openSrc: lang === "en" ? "Open source" : "เปิดแหล่งข้อมูล",
});

/** Component */
export default function KnowledgePage() {
  const { language } = useLanguage();
  const lang: Lang = (language as Lang) ?? "th";
  const L = t(lang);

  // Articles search/filter
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"All" | Article["kind"]>("All");

  const filteredArticles = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return ARTICLES.filter(a => {
      const matchKind = kind === "All" ? true : a.kind === kind;
      const title = (lang === "en" ? a.titleEn : a.titleTh).toLowerCase();
      const author = a.authors.toLowerCase();
      const matchText = !kw || title.includes(kw) || author.includes(kw);
      return matchKind && matchText;
    });
  }, [q, kind, lang]);

  const handleDownload = (file: string) => {
    // mock download
    alert(
      lang === "en"
        ? `🔽 Mock download: ${file}`
        : `🔽 ดาวน์โหลดจำลอง: ${file}`
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{L.pageTitle}</h1>
      <p className={styles.subtitle}>{L.pageDesc}</p>

      {/* Section 1: Test Information */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <BookOpen size={18} style={{ marginRight: 6 }} /> {L.s1}
        </h2>
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{L.columnsTest.code}</th>
                <th>{L.columnsTest.name}</th>
                <th>{L.columnsTest.specimen}</th>
                <th>{L.columnsTest.volume}</th>
                <th>{L.columnsTest.tat}</th>
                <th>{L.columnsTest.dl}</th>
              </tr>
            </thead>
            <tbody>
              {TESTS.map(t => (
                <tr key={t.code}>
                  <td>{t.code}</td>
                  <td>{lang === "en" ? t.nameEn : t.nameTh}</td>
                  <td>{t.specimen}</td>
                  <td>{t.volume}</td>
                  <td>{t.tat}</td>
                  <td>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => handleDownload(t.pdfFile)}
                    >
                      <Download size={16} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: CDS Rules */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FlaskConical size={18} style={{ marginRight: 6 }} /> {L.s2}
        </h2>
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{L.columnsCDS.gene}</th>
                <th>{L.columnsCDS.genotype}</th>
                <th>{L.columnsCDS.pheno}</th>
                <th>{L.columnsCDS.rec}</th>
                <th>{L.columnsCDS.ref}</th>
              </tr>
            </thead>
            <tbody>
              {CDS.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.gene}</td>
                  <td>{r.genotype}</td>
                  <td>{lang === "en" ? r.phenotypeEn : r.phenotypeTh}</td>
                  <td>{lang === "en" ? r.recommendationEn : r.recommendationTh}</td>
                  <td>{r.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: HLA–Drug Alerts */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <ShieldAlert size={18} style={{ marginRight: 6 }} /> {L.s3}
        </h2>
        <div className={styles.alertGrid}>
          {HLA_ALERTS.map((a, i) => (
            <div key={i} className={styles.alertCard}>
              <div className={styles.alertHead}>
                <ShieldAlert size={16} /> {a.hla} ↔ {a.drug}
              </div>
              <div style={{ marginTop: 6 }}>
                {lang === "en" ? a.noteEn : a.noteTh}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Dose Adjustment Guides */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{L.s4}</h2>
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{L.columnsDose.drug}</th>
                <th>{L.columnsDose.genotype}</th>
                <th>{L.columnsDose.rec}</th>
                <th>{L.columnsDose.note}</th>
              </tr>
            </thead>
            <tbody>
              {DOSE_GUIDES.map((d, idx) => (
                <tr key={idx}>
                  <td><span className={styles.pill}>{d.drug}</span></td>
                  <td>{d.genotype}</td>
                  <td>{lang === "en" ? d.recommendationEn : d.recommendationTh}</td>
                  <td className={styles.muted}>
                    {lang === "en" ? d.commentEn ?? "-" : d.commentTh ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Knowledge Articles */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>{L.s5}</h2>

        <div className={styles.toolbar}>
          <div className={styles.badge}>
            {lang === "en" ? "Articles mock data" : "ข้อมูลบทความ (จำลอง)"}
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Search size={16} />
            <input
              className={styles.input}
              style={{ width: 240 }}
              placeholder={L.searchPH}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Filter size={16} />
            <select
              className={styles.select}
              value={kind}
              onChange={(e) => setKind(e.target.value as any)}
            >
              <option value="All">{L.filterAll}</option>
              <option value="Clinical">Clinical</option>
              <option value="Research">Research</option>
              <option value="Funding">Funding</option>
            </select>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {filteredArticles.map((a) => (
            <div key={a.id} className={styles.card}>
              <div className={styles.cardTitle}>
                {lang === "en" ? a.titleEn : a.titleTh}
              </div>
              <div className={styles.cardMeta}>
                {a.kind} • {a.authors} • {a.year}
              </div>
              <div className={styles.cardActions}>
                {a.file && (
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => handleDownload(a.file!)}
                  >
                    <Download size={16} />
                    {L.openPDF}
                  </button>
                )}
                <a
                  className={`${styles.btn} ${styles.btnGhost}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      lang === "en"
                        ? `Open source: ${a.source} (mock)`
                        : `เปิดแหล่งข้อมูล: ${a.source} (จำลอง)`
                    );
                  }}
                >
                  <ExternalLink size={16} />
                  {L.openSrc}
                </a>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <p className={styles.muted} style={{ marginTop: 8 }}>
            {lang === "en" ? "No articles found." : "ไม่พบบทความที่ตรงกับการค้นหา"}
          </p>
        )}
      </div>
    </div>
  );
}
