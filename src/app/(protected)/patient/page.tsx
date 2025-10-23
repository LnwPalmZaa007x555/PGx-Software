"use client";

import { usePatients } from "@/context/PatientContext";
import { useState } from "react";
import { Search, User, Save } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./page.module.css";

export default function PatientPage() {
  const { patients, addPatient } = usePatients();
  const { language } = useLanguage();

  const [form, setForm] = useState({
    idCard: "",
    firstName: "",
    lastName: "",
    sex: "",
    dob: "",
    phone: "",
    ethnicity: "",
    otherEthnicity: "",
  });

  const [searchId, setSearchId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  // ===== Search & Autofill =====
  const handleSearch = () => {
    if (!/^\d{13}$/.test(searchId)) {
      setErrors((prev) => ({
        ...prev,
        searchId:
          language === "en"
            ? "ID Card must be 13 digits"
            : "เลขบัตรประชาชนต้องมี 13 หลัก",
      }));
      return;
    }

    const existing = patients.find((p) => p.idCard === searchId);

    if (existing) {
      const fieldsToFill = [
        "idCard",
        "firstName",
        "lastName",
        "sex",
        "dob",
        "phone",
        "ethnicity",
        "otherEthnicity",
      ];

      setForm({
        idCard: existing.idCard,
        firstName: existing.firstName,
        lastName: existing.lastName,
        sex: existing.sex,
        dob: existing.dob,
        phone: existing.phone,
        ethnicity: existing.ethnicity,
        otherEthnicity: existing.otherEthnicity || "",
      });

      setErrors((prev) => {
        const cleared = { ...prev };
        fieldsToFill.concat("searchId").forEach((k) => delete cleared[k]);
        return cleared;
      });

      setHighlightedFields(fieldsToFill);
      setTimeout(() => setHighlightedFields([]), 2000);
    } else {
      setErrors((prev) => ({
        ...prev,
        searchId:
          language === "en"
            ? "No patient record found"
            : "ไม่พบข้อมูลผู้ป่วย",
      }));
    }
  };

  // ===== Handlers =====
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "idCard") {
      const onlyNums = value.replace(/\D/g, "").slice(0, 13);
      setForm((prev) => ({ ...prev, idCard: onlyNums }));
      setErrors((prev) => ({ ...prev, idCard: "" }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRadio = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ===== Validate =====
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!/^\d{13}$/.test(form.idCard))
      newErrors.idCard =
        language === "en"
          ? "ID Card must be 13 digits"
          : "เลขบัตรประชาชนต้องมี 13 หลัก";

    if (!form.firstName)
      newErrors.firstName =
        language === "en" ? "First name is required" : "กรุณากรอกชื่อ";

    if (!form.lastName)
      newErrors.lastName =
        language === "en" ? "Last name is required" : "กรุณากรอกนามสกุล";

    if (!form.sex)
      newErrors.sex =
        language === "en" ? "Please select sex" : "กรุณาเลือกเพศ";

    if (!form.dob) {
      newErrors.dob =
        language === "en"
          ? "Date of birth is required"
          : "กรุณาเลือกวันเดือนปีเกิด";
    } else if (new Date(form.dob) >= new Date()) {
      newErrors.dob =
        language === "en"
          ? "Date of birth cannot be today or future"
          : "วันเกิดต้องไม่เป็นวันที่ปัจจุบันหรืออนาคต";
    }

    if (!/^\d{10}$/.test(form.phone))
      newErrors.phone =
        language === "en"
          ? "Phone must be 10 digits"
          : "เบอร์โทรศัพท์ต้องมี 10 หลัก";

    if (!form.ethnicity) {
      newErrors.ethnicity =
        language === "en"
          ? "Please select ethnicity"
          : "กรุณาเลือกเชื้อชาติ";
    } else if (form.ethnicity === "other" && !form.otherEthnicity) {
      newErrors.otherEthnicity =
        language === "en"
          ? "Please specify ethnicity"
          : "กรุณาระบุเชื้อชาติ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== Submit =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addPatient({
      ...form,
      gene: "",
      markerValues: {},
      genotype: "",
      phenotype: "",
      status: "pending_gene",
    });

    alert(
      language === "en"
        ? "✅ Patient record saved successfully!"
        : "✅ บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว!"
    );

    setForm({
      idCard: "",
      firstName: "",
      lastName: "",
      sex: "",
      dob: "",
      phone: "",
      ethnicity: "",
      otherEthnicity: "",
    });
  };

  // ===== UI =====
  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h1 className={styles.title}>
        {language === "en" ? "Patient Form" : "แบบฟอร์มผู้ป่วย"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Add new patient record"
          : "เพิ่มข้อมูลผู้ป่วยใหม่"}
      </p>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          className={`${styles.searchInput} ${
            errors.searchId ? styles.errorInput : ""
          }`}
          value={searchId}
          onChange={(e) => {
            const only = e.target.value.replace(/\D/g, "").slice(0, 13);
            setSearchId(only);
            setErrors((prev) => ({ ...prev, searchId: "" }));
          }}
          placeholder={
            language === "en"
              ? "Search by ID Card (13 digits)"
              : "ค้นหาด้วยเลขบัตรประชาชน (13 หลัก)"
          }
          maxLength={13}
        />
        <button
          type="button"
          className={styles.searchButton}
          onClick={handleSearch}
        >
          <Search size={18} />
        </button>
      </div>
      {errors.searchId && (
        <span className={styles.searchError}>{errors.searchId}</span>
      )}

      {/* Patient Info */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <User size={18} color="#4CA771" style={{ marginRight: 6 }} />
          {language === "en" ? "Patient Information" : "ข้อมูลผู้ป่วย"}
        </h2>

        {/* ID Card */}
        <div className={styles.field}>
          <label className={styles.label}>
            {language === "en" ? "ID Card" : "เลขบัตรประชาชน"}
          </label>
          <input
            type="text"
            className={`${styles.input} ${
              errors.idCard ? styles.errorInput : ""
            } ${highlightedFields.includes("idCard") ? styles.autofilled : ""}`}
            name="idCard"
            value={form.idCard}
            onChange={handleChange}
            placeholder={
              language === "en"
                ? "ID Card (13 digits)"
                : "เลขบัตรประชาชน (13 หลัก)"
            }
            maxLength={13}
          />
          {errors.idCard && (
            <span className={styles.error}>{errors.idCard}</span>
          )}
        </div>

        {/* First + Last */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>
              {language === "en" ? "Firstname" : "ชื่อ"}
            </label>
            <input
              className={`${styles.input} ${
                errors.firstName ? styles.errorInput : ""
              } ${
                highlightedFields.includes("firstName") ? styles.autofilled : ""
              }`}
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder={language === "en" ? "First Name" : "ชื่อ"}
            />
            {errors.firstName && (
              <span className={styles.error}>{errors.firstName}</span>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              {language === "en" ? "Lastname" : "นามสกุล"}
            </label>
            <input
              className={`${styles.input} ${
                errors.lastName ? styles.errorInput : ""
              } ${
                highlightedFields.includes("lastName") ? styles.autofilled : ""
              }`}
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder={language === "en" ? "Last Name" : "นามสกุล"}
            />
            {errors.lastName && (
              <span className={styles.error}>{errors.lastName}</span>
            )}
          </div>
        </div>

        {/* DOB + Sex */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>
              {language === "en" ? "Date of Birth" : "วันเดือนปีเกิด"}
            </label>
            <input
              type="date"
              className={`${styles.input} ${styles.dateInput} ${
                errors.dob ? styles.errorInput : ""
              } ${highlightedFields.includes("dob") ? styles.autofilled : ""}`}
              name="dob"
              value={form.dob}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.dob && <span className={styles.error}>{errors.dob}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              {language === "en" ? "Sex" : "เพศ"}
            </label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  className={styles.radioInput}
                  name="sex"
                  checked={form.sex === "male"}
                  onChange={() => handleRadio("sex", "male")}
                />
                {language === "en" ? "Male" : "ชาย"}
              </label>
              <label>
                <input
                  type="radio"
                  className={styles.radioInput}
                  name="sex"
                  checked={form.sex === "female"}
                  onChange={() => handleRadio("sex", "female")}
                />
                {language === "en" ? "Female" : "หญิง"}
              </label>
            </div>
            {errors.sex && <span className={styles.error}>{errors.sex}</span>}
          </div>
        </div>

        {/* Phone */}
        <div className={styles.field}>
          <label className={styles.label}>
            {language === "en" ? "Phone" : "เบอร์โทรศัพท์"}
          </label>
          <input
            type="text"
            className={`${styles.input} ${
              errors.phone ? styles.errorInput : ""
            } ${highlightedFields.includes("phone") ? styles.autofilled : ""}`}
            name="phone"
            value={form.phone}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 10);
              setForm((prev) => ({ ...prev, phone: onlyNums }));
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            placeholder={
              language === "en"
                ? "Phone (10 digits)"
                : "เบอร์โทรศัพท์ (10 หลัก)"
            }
            maxLength={10}
          />
          {errors.phone && <span className={styles.error}>{errors.phone}</span>}
        </div>

        {/* Ethnicity */}
        <div className={styles.field}>
          <label className={styles.label}>
            {language === "en" ? "Ethnicity" : "เชื้อชาติ"}
          </label>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                className={styles.radioInput}
                name="ethnicity"
                checked={form.ethnicity === "thai"}
                onChange={() => handleRadio("ethnicity", "thai")}
              />
              {language === "en" ? "Thai" : "ไทย"}
            </label>
            <label>
              <input
                type="radio"
                className={styles.radioInput}
                name="ethnicity"
                checked={form.ethnicity === "other"}
                onChange={() => handleRadio("ethnicity", "other")}
              />
              {language === "en" ? "Other" : "อื่น ๆ"}
            </label>
          </div>

          {form.ethnicity === "other" && (
            <input
              className={`${styles.input} ${
                errors.otherEthnicity ? styles.errorInput : ""
              } ${
                highlightedFields.includes("otherEthnicity")
                  ? styles.autofilled
                  : ""
              }`}
              name="otherEthnicity"
              value={form.otherEthnicity}
              onChange={handleChange}
              placeholder={
                language === "en"
                  ? "Specify ethnicity"
                  : "ระบุเชื้อชาติอื่น ๆ"
              }
            />
          )}

          {errors.ethnicity && (
            <span className={styles.error}>{errors.ethnicity}</span>
          )}
          {errors.otherEthnicity && (
            <span className={styles.error}>{errors.otherEthnicity}</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.button} type="submit">
          <Save size={18} style={{ marginRight: 6 }} />
          {language === "en" ? "Save" : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
