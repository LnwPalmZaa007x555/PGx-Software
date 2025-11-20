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

// 👉 ใช้ utils ดึง latest-result ตาม idCard (HN)
import {
  fetchLatestResultByIdCard,
  type LatestWithGeneDto,
} from "@/utils/results";

// ==================== Types ====================
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

// ==================== Helpers: map status / rows ====================
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
      sex: (p.Gender || "").toLowerCase(), // "male" | "female"
      age: p.Age,
      phone: p.Phone,
      ethnicity: isThai ? "thai" : "other",
      otherEthnicity: isThai ? undefined : p.Ethnicity,
      status: mapStatus(p.status || ""),
    };
  });
}

// ==================== PDF helpers ====================
// ⚠️ อย่าลืมวางไฟล์จริงใน /public/templates/ ตามชื่อด้านล่างนี้
//   /public/templates/CYP2C9.pdf
//   /public/templates/CYP2C19.pdf
//   /public/templates/CYP2D6.pdf
//   /public/templates/CYP3A5.pdf
//   /public/templates/VKORC1.pdf
//   /public/templates/TPMT.pdf
//   /public/templates/HLA_B_1502.pdf
//   /public/templates/DEFAULT_PGX.pdf

function getPdfTemplatePathFromGene(geneNameRaw?: string): string {
  if (!geneNameRaw) return "/templates/DEFAULT_PGX.pdf";

  const g = geneNameRaw.toUpperCase().trim();

  // จัดการเคส HLA_B / HLA-B*15:02
  if (g === "HLA_B" || g.includes("HLA-B")) {
    return "/templates/HLA_B_1502.pdf";
  }

  if (g === "CYP2C9" || g.includes("CYP2C9")) {
    return "/templates/CYP2C9.pdf";
  }

  if (g === "CYP2C19" || g.includes("CYP2C19")) {
    return "/templates/CYP2C19.pdf";
  }

  if (g === "CYP2D6" || g.includes("CYP2D6")) {
    return "/templates/CYP2D6.pdf";
  }

  if (g === "CYP3A5" || g.includes("CYP3A5")) {
    return "/templates/CYP3A5.pdf";
  }

  if (g === "VKORC1" || g.includes("VKORC1")) {
    return "/templates/VKORC1.pdf";
  }

  if (g === "TPMT" || g.includes("TPMT")) {
    return "/templates/TPMT.pdf";
  }

  // ถ้าไม่รู้จัก → ใช้ DEFAULT
  return "/templates/DEFAULT_PGX.pdf";
}

// Uint8Array → ArrayBuffer (กัน TS งอแง)
function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(u8.byteLength);
  const view = new Uint8Array(buffer);
  view.set(u8);
  return buffer;
}

// ==================== เปิด PDF เทมเพลต + ดึง result จาก API แล้วเขียนลง ====================
async function openFilledPdf(patient: PatientRow, language: string) {
  try {
    // 🔹 ใช้ utils เรียก backend: /results/by-idcard/:idCard/latest-with-gene
    const latest: LatestWithGeneDto = await fetchLatestResultByIdCard(
      patient.idCard
    );

    const geneName = latest.gene?.gene_name || "";
    const templatePath = getPdfTemplatePathFromGene(geneName);

    // 1) dynamic import pdf-lib / fontkit (กัน SSR ป่วน)
    const pdfLib = await import("pdf-lib");
    const fontkitModule = await import("@pdf-lib/fontkit");
    const { PDFDocument, rgb } = pdfLib;
    const fontkit = fontkitModule.default;

    // 2) โหลด template ตามยีน + ฟอนต์ไทย
    const [tplAB, fontAB] = await Promise.all([
      fetch(templatePath).then((r) => {
        if (!r.ok) {
          throw new Error(`โหลดไฟล์เทมเพลตไม่สำเร็จ: ${templatePath}`);
        }
        return r.arrayBuffer();
      }),
      fetch("/fonts/THSarabunNew.ttf").then((r) => {
        if (!r.ok) throw new Error("โหลดฟอนต์ THSarabunNew ไม่สำเร็จ");
        return r.arrayBuffer();
      }),
    ]);

    const pdfDoc = await PDFDocument.load(tplAB);
    pdfDoc.registerFontkit(fontkit);
    const thaiFont = await pdfDoc.embedFont(fontAB);

    const page = pdfDoc.getPage(0);
    const draw = (text: string | number, x: number, y: number, size = 12) =>
      page.drawText(String(text ?? "-"), {
        x,
        y,
        size,
        font: thaiFont,
        color: rgb(0, 0, 0),
      });

    const isEn = language === "en";

    // ================== PATIENT INFO (บนฟอร์มด้านบน) ==================
    draw(`${patient.firstName} ${patient.lastName}`, 180, 653); // ชื่อ-นามสกุล

    const sexLabel =
      patient.sex === "male"
        ? isEn
          ? "Male"
          : "ชาย"
        : patient.sex === "female"
        ? isEn
          ? "Female"
          : "หญิง"
        : "-";
    draw(sexLabel, 520, 653); // เพศ

    draw(patient.idCard, 180, 630); // HN / Id_Card

    if (patient.age) {
      draw(patient.age, 363, 653); // อายุ
    }

    draw(patient.phone || "-", 444, 612); // เบอร์โทร

    const ethnicityLabel =
      patient.ethnicity === "thai"
        ? isEn
          ? "Thai"
          : "ไทย"
        : patient.otherEthnicity || "-";
    draw(ethnicityLabel, 180, 592); // สัญชาติ

    //draw("EDTA Blood", 470, 690); // สิ่งส่งตรวจ

    // ================== RESULT + PHENO + MARKERS (แยกต่อ gene) ==================
    const predictedPheno = latest.predict_pheno || "-";
    const recommendation = latest.recommend || "-";

    const genotypeLabel =
      (latest.result as any)?.Genotype ??
      (latest.result as any)?.genotype ??
      "-";

    const markers = latest.markers || {};
    const gNorm = geneName.toUpperCase().trim();

    // helper เล็ก ๆ ไว้ wrap ข้อความยาว
    const drawWrapped = (
      text: string,
      startX: number,
      startY: number,
      maxLineChars = 70,
      lineHeight = 14
    ) => {
      let y = startY;
      for (let i = 0; i < text.length; i += maxLineChars) {
        const line = text.slice(i, i + maxLineChars);
        draw(line, startX, y);
        y -= lineHeight;
      }
      return y;
    };

    if (gNorm.includes("TPMT")) {
      // ===================== TPMT.pdf layout =====================
      // ปรับ x,y ให้ตรงช่องจริงในเทมเพลตของ TPMT
      //draw("TPMT", 120, 580);               // label TPMT
      draw(genotypeLabel, 260, 580);        // ช่อง Genotype
      draw(predictedPheno, 255, 425);       // ช่อง Phenotype

      const m3c = markers["TPMT*3C (719A>G)"] || "-";
      draw(m3c, 255, 445);                  // ช่อง allele TPMT*3C

      let yRec = 480;
    //yRec = drawWrapped(recommendation,120,yRec,70,14);

    } else if (gNorm.includes("CYP2C9")) {
      // ===================== CYP2C9.pdf layout =====================
      //draw("CYP2C9", 120, 580);
      draw(genotypeLabel, 260, 580);
      draw(predictedPheno, 220, 430);

      const m2 = markers["CYP2C9*2 (430C>T)"] || "-";
      const m3 = markers["CYP2C9*3 (1075A>C)"] || "-";

      draw(m2, 220, 490); // ช่อง *2
      draw(m3, 220, 470); // ช่อง *3

      let yRec = 413;
      yRec = drawWrapped(recommendation, 220, yRec, 80, 14);

    } else if (gNorm.includes("CYP2C19")) {
      // ===================== CYP2C19.pdf layout =====================
      //draw("CYP2C19", 120, 580);
      //draw(genotypeLabel, 230, 435);
      draw(predictedPheno, 230, 415);

      const m2 = markers["CYP2C19*2 (681G>A)"] || "-";
      const m3 = markers["CYP2C19*3 (636G>A)"] || "-";
      const m17 = markers["CYP2C19*17 (-806C>T)"] || "-";

      draw(m2, 230, 495);   // ช่อง *2
      draw(m3, 230, 475);   // ช่อง *3
      draw(m17, 230, 455);  // ช่อง *17

      let yRec = 395;
      yRec = drawWrapped(recommendation, 230, yRec, 90, 8);
      yRec -= 70;

    } else if (gNorm.includes("CYP2D6")) {
      // ===================== CYP2D6.pdf layout =====================
      //draw("CYP2D6", 120, 580);
      draw(genotypeLabel, 260, 375);
      draw(predictedPheno, 260, 335);

      const m4   = markers["CYP2D6*4 (1847G>A)"] || "-";
      const m10  = markers["CYP2D6*10 (100C>T)"] || "-";
      const m41  = markers["CYP2D6*41 (2989G>A)"] || "-";
      const cnv2 = markers["CNV intron 2"] || "-";
      const cnv9 = markers["CNV exon 9"] || "-";

      // ปรับ x,y ให้ตรงช่องใน CYP2D6.pdf ของคุณ
      draw(m4,   260, 435);
      draw(m10,  260, 415);
      draw(m41,  260, 395);
      //draw(cnv2, 260, 435);
      //draw(cnv9, 260, 415);

      let yRec = 400;
      //yRec = drawWrapped(recommendation, 230, yRec, 90, 8);

    } else if (gNorm.includes("CYP3A5")) {
      // ===================== CYP3A5.pdf layout =====================
      draw("CYP3A5", 120, 580);
      //draw(genotypeLabel, 260, 580);
      //draw(predictedPheno, 120, 560);

      const m3 = markers["CYP3A5*3 (6986A>G)"] || "-";
      draw(m3, 260, 490); // ช่อง allele CYP3A5*3

      let yRec = 350;
      yRec = drawWrapped(recommendation, 250, yRec, 70, 14);

    } else if (gNorm.includes("VKORC1")) {
      // ===================== VKORC1.pdf layout =====================
      draw("VKORC1", 120, 580);
      draw(genotypeLabel, 260, 580);
      draw(predictedPheno, 120, 560);

      const m1173 = markers["VKORC1 (1173C>T)"] || "-";
      const m1639 = markers["VKORC1 (-1639G>A)"] || "-";

      draw(m1173, 260, 520); // ช่อง 1173C>T
      draw(m1639, 260, 500); // ช่อง -1639G>A

      let yRec = 460;
      yRec = drawWrapped(recommendation, 120, yRec, 70, 14);

    } else if (gNorm.includes("HLA") || gNorm.includes("HLA-B")) {
      // ===================== HLA_B_1502.pdf layout =====================
      draw("HLA-B*15:02", 120, 580);
      draw(genotypeLabel, 260, 580);
      draw(predictedPheno, 120, 560);

      const status = markers["HLA-B*15:02 status"] || "-";
      draw(status, 260, 520); // ช่องสถานะ carrier / negative

      let yRec = 480;
      yRec = drawWrapped(recommendation, 120, yRec, 70, 14);

    } else {
      // ===================== Fallback generic layout =====================
      let y = 610;
      draw(`Gene: ${geneName || "-"}`, 90, y);
      y -= 18;

      draw(`Genotype: ${genotypeLabel}`, 90, y);
      y -= 18;

      draw(`Predicted Phenotype: ${predictedPheno}`, 90, y);
      y -= 18;

      draw(
        isEn ? "Therapeutic recommendation:" : "คำแนะนำการใช้ยา:",
        90,
        y
      );
      y -= 16;

      y = drawWrapped(recommendation, 100, y, 70, 14);

      const entries = Object.entries(markers);
      if (entries.length > 0) {
        y -= 10;
        draw(isEn ? "Markers:" : "ตัวชี้วัด (Markers):", 90, y);
        y -= 16;

        for (const [markerName, value] of entries) {
          if (y < 120) break;
          draw(`• ${markerName}: ${value || "-"}`, 95, y);
          y -= 14;
        }
      }
    }

    // ================== SIGNATURE / FOOTER ==================
    // ถ้าใน template มีลายเซ็นอยู่แล้วจะคอมเมนต์ 3 บรรทัดนี้ทิ้งก็ได้
    draw("_______________________", 90, 200);
    draw("_______________________", 330, 200);
    draw("ศ.ดร.ภก.ชลภัทร สุขเกษม", 90, 185);
    draw("ทนพญ.นนทกร สกุลวิทยาสุข", 330, 185);

    // 4) สร้าง Blob และเปิดแท็บใหม่
    const bytes = await pdfDoc.save();
    const arrayBuffer = u8ToArrayBuffer(bytes);
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    const urlPdf = URL.createObjectURL(blob);

    window.open(urlPdf, "_blank");
    setTimeout(() => URL.revokeObjectURL(urlPdf), 60_000);
  } catch (err: any) {
    console.error(err);
    alert(
      language === "en"
        ? `Error generating PDF: ${err?.message || err}`
        : `เกิดข้อผิดพลาดขณะสร้าง PDF: ${err?.message || err}`
    );
  }
}

// ==================== เพจหลัก ====================
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
                    {/* 👁 ปุ่มตา: เปิด PDF ตามยีน + เขียนผลลง */}
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => openFilledPdf(p, language)}
                      title={
                        language === "en"
                          ? "Open PDF report"
                          : "เปิดรายงาน PDF"
                      }
                    >
                      <Eye size={16} />
                    </button>

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
