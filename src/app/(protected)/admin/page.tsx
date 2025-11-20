"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FileLock,
  Link,
  Settings,
  Key,
  FileText,
  Download,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
} from "lucide-react";
import styles from "./page.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { meRequest } from "@/utils/auth";
import { fetchStaff, updateStaffById, createStaff, fetchStaffByEmail, resetStaffPasswordById, type StaffDto } from "@/utils/staff";

/* Types */
type RoleOption = "Admin" | "Doctor" | "MedTech" | "Pharmacist";

interface User {
  id: number;
  fname: string;
  lname: string;
  role: RoleOption;
  email: string;
  hospital?: string;
}

interface Audit {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

type PDPAItemKey =
  | "econsent"
  | "templates"
  | "retention"
  | "dpia"
  | "rop"
  | "breach";

type IntegrationKey = "his" | "analyzer" | "external";

/* Helpers */

export default function AdminPanel() {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "th";
  const router = useRouter();

  /* ---------------- USERS ---------------- */
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Check role
        const me = await meRequest();
        if ((me.Role || "").toLowerCase() !== "admin") {
          // redirect non-admins out of this page
          router.replace("/dashboard");
          return;
        }
        const staff = await fetchStaff();
        const mapped: User[] = staff.map((s) => ({
          id: s.Staff_Id,
          fname: s.Fname,
          lname: s.Lname,
          email: s.email,
          role: (s.Role as RoleOption) || "Doctor",
        }));
        setUsers(mapped);
      } catch (e: unknown) {
        const apiErr = (e as { response?: { data?: { error?: unknown } } }).response?.data?.error;
        const msg = typeof apiErr === "string" ? apiErr : e instanceof Error ? e.message : "Failed to load staff";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Add/Edit User Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<User>({ id: 0, fname: "", lname: "", email: "", role: "Doctor", hospital: "" });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const openAddUser = () => {
    setNewUser({ id: 0, fname: "", lname: "", email: "", role: "Doctor", hospital: "" });
    setShowAddUser(true);
  };
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const saveNewUser = async () => {
    setAddError(null);
    if (!newUser.fname || !newUser.lname || !newUser.email || !newUser.hospital) {
      setAddError(lang === "en" ? "Please fill all fields" : "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    try {
      setAdding(true);
      const created = await createStaff({
        Fname: newUser.fname,
        Lname: newUser.lname,
        Role: newUser.role,
        email: newUser.email,
        Hospital_Name: newUser.hospital || "",
      });
      // append to UI list
      setUsers((prev) => [
        ...prev,
        {
          id: created.Staff_Id,
          fname: created.Fname,
          lname: created.Lname,
          email: created.email,
          role: created.Role as RoleOption,
          hospital: created.Hospital_Name,
        },
      ]);
      setShowAddUser(false);
<<<<<<< HEAD
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to create staff";
      setAddError(typeof msg === "string" ? msg : lang === "en" ? "Validation error" : "ข้อมูลไม่ถูกต้อง");
=======
    } catch (e: unknown) {
      const apiErr = (e as { response?: { data?: { error?: unknown } } }).response?.data?.error;
      const msg = typeof apiErr === "string" ? apiErr : e instanceof Error ? e.message : "Failed to create staff";
      setAddError(typeof msg === "string" ? msg : (lang === "en" ? "Validation error" : "ข้อมูลไม่ถูกต้อง"));
>>>>>>> Endplease
    } finally {
      setAdding(false);
    }
  };
  const saveEditUser = async () => {
    if (!editUser) return;
    if (!editUser.fname || !editUser.lname || !editUser.email) return;
    const patch = { Fname: editUser.fname, Lname: editUser.lname, email: editUser.email, Role: editUser.role } as Partial<StaffDto>;
    const updated = await updateStaffById(editUser.id, patch);
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, fname: updated.Fname, lname: updated.Lname, email: updated.email, role: updated.Role as RoleOption } : u)));
    setEditUser(null);
  };
  const confirmDelete = () => {
    if (deleteUserId == null) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteUserId));
    setDeleteUserId(null);
  };

  /* ---------------- Reset Password (Admin Only) ---------------- */
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<"verify" | "set">("verify");
  const [resetTarget, setResetTarget] = useState<StaffDto | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  const openResetModal = () => {
    setShowResetPwd(true);
    setResetEmail("");
    setResetPwd("");
    setResetError(null);
    setResetTarget(null);
    setResetStep("verify");
  };

  const verifyResetEmail = async () => {
    setResetError(null);
    if (!resetEmail) {
      setResetError(lang === "en" ? "Please enter email" : "กรุณากรอกอีเมล");
      return;
    }
    try {
      setResetBusy(true);
      const staff = await fetchStaffByEmail(resetEmail);
      if (!staff) {
        setResetError(lang === "en" ? "Email not found" : "ไม่พบอีเมลนี้ในระบบ");
        return;
      }
      setResetTarget(staff);
      setResetStep("set");
<<<<<<< HEAD
    } catch (e: any) {
      setResetError(e?.response?.data?.error || e?.message || "Failed to verify email");
=======
    } catch (e: unknown) {
      const apiErr = (e as { response?: { data?: { error?: unknown } } }).response?.data?.error;
      const msg = typeof apiErr === "string" ? apiErr : e instanceof Error ? e.message : "Failed to verify email";
      setResetError(msg);
>>>>>>> Endplease
    } finally {
      setResetBusy(false);
    }
  };

  const submitResetPassword = async () => {
    setResetError(null);
    if (!resetTarget) return;
    if (!resetPwd || resetPwd.length < 8) {
      setResetError(lang === "en" ? "Password must be at least 8 characters" : "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    try {
      setResetBusy(true);
      await resetStaffPasswordById(resetTarget.Staff_Id, resetPwd);
      setShowResetPwd(false);
<<<<<<< HEAD
    } catch (e: any) {
      setResetError(e?.response?.data?.error || e?.message || "Failed to reset password");
=======
    } catch (e: unknown) {
      const apiErr = (e as { response?: { data?: { error?: unknown } } }).response?.data?.error;
      const msg = typeof apiErr === "string" ? apiErr : e instanceof Error ? e.message : "Failed to reset password";
      setResetError(msg);
>>>>>>> Endplease
    } finally {
      setResetBusy(false);
    }
  };

  /* ---------------- PDPA ---------------- */
  const pdpaMap: Record<PDPAItemKey, string> = useMemo(
    () => ({
      econsent: lang === "en" ? "e-Consent setup" : "ตั้งค่า e-Consent",
      templates: lang === "en" ? "Consent Templates" : "เทมเพลต Consent",
      retention: lang === "en" ? "Retention Policy" : "ระยะเวลาเก็บรักษา",
      dpia: lang === "en" ? "Risk Assessment (DPIA)" : "แบบประเมินความเสี่ยง (DPIA)",
      rop: lang === "en" ? "Records of Processing" : "บันทึกร่องรอยการประมวลผล",
      breach: lang === "en" ? "Data Breach Handling" : "กระบวนการแจ้งเหตุละเมิดข้อมูล",
    }),
    [lang]
  );

  type PDPAConfig = {
    version?: string;
    purpose?: string;
    retentionDays?: number;
    note?: string;
  };
  const [pdpaModal, setPdpaModal] = useState<PDPAItemKey | null>(null);
  const [pdpaConfig, setPdpaConfig] = useState<PDPAConfig>({
    version: "v1.0",
    purpose: "",
    retentionDays: 365,
    note: "",
  });
  const savePdpa = () => {
    // mock save
    setPdpaModal(null);
  };

  /* ---------------- Integration ---------------- */
  const [integrationModal, setIntegrationModal] = useState<IntegrationKey | null>(null);
  const [integrationForm, setIntegrationForm] = useState({
    endpoint: "",
    token: "",
    status: "Disconnected",
  });
  const saveIntegration = () => {
    setIntegrationForm((f) => ({ ...f, status: "Connected" }));
    setIntegrationModal(null);
  };

  /* ---------------- System Settings ---------------- */
  const [sysModal, setSysModal] = useState(false);
  const [isoMessage, setIsoMessage] = useState("");
  const [logoFile, setLogoFile] = useState<string>("");

  /* ---------------- License & TT ---------------- */
  const [licenseModal, setLicenseModal] = useState(false);

  /* ---------------- Audit ---------------- */
  const [logs] = useState<Audit[]>([
    { id: "1", user: "Admin", action: "Login", timestamp: "2025-11-01 09:20" },
    { id: "2", user: "Somchai", action: "Viewed Patient #102", timestamp: "2025-11-01 10:05" },
    { id: "3", user: "Anan", action: "Edited SOP#2", timestamp: "2025-11-01 13:12" },
  ]);
  const [viewLog, setViewLog] = useState<Audit | null>(null);

  /* UI text */
  const txt = {
    pageTitle: lang === "en" ? "System Settings (Admin Panel)" : "การตั้งค่าระบบ (Admin Panel)",
    pageDesc:
      lang === "en"
        ? "Manage users, privacy (PDPA), integrations, and audit logs."
        : "จัดการผู้ใช้ ความเป็นส่วนตัว (PDPA) การเชื่อมต่อ และบันทึกการใช้งาน",
    users: lang === "en" ? "User Management" : "การจัดการผู้ใช้งาน",
    add: lang === "en" ? "Add" : "เพิ่ม",
    edit: lang === "en" ? "Edit" : "แก้ไข",
    delete: lang === "en" ? "Delete" : "ลบ",
    save: lang === "en" ? "Save" : "บันทึก",
    cancel: lang === "en" ? "Cancel" : "ยกเลิก",
    pdpa: "PDPA Management",
    cfg: lang === "en" ? "Configure" : "ตั้งค่า",
    integ: "Integration Settings",
    sys: lang === "en" ? "System Settings" : "การตั้งค่าทั่วไป",
    license: lang === "en" ? "License & Technology Transfer" : "สิทธิ์การใช้งาน & ถ่ายทอดเทคโนโลยี",
    audit: "Audit Log",
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{txt.pageTitle}</h1>
      <p className={styles.subtitle}>{txt.pageDesc}</p>

      {/* USER MANAGEMENT */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Users size={18} /> {txt.users}
        </h2>

        <div className={styles.row} style={{ marginBottom: ".8rem" }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openAddUser}>
            <Plus size={16} /> {txt.add} User
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ marginLeft: ".5rem" }}
            onClick={openResetModal}
          >
            <Key size={16} /> {lang === "en" ? "Reset Password" : "รีเซ็ตรหัสผ่าน"}
          </button>
        </div>

        {loading ? (
          <p>{lang === "en" ? "Loading..." : "กำลังโหลด..."}</p>
        ) : error ? (
          <p style={{ color: "#b91c1c" }}>{error}</p>
        ) : (
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{lang === "en" ? "First name" : "ชื่อ"}</th>
                <th>{lang === "en" ? "Last name" : "นามสกุล"}</th>
                <th>Email</th>
                <th>{lang === "en" ? "Role" : "สิทธิ์"}</th>
                <th>{lang === "en" ? "Actions" : "การทำงาน"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fname}</td>
                  <td>{u.lname}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td className={styles.row}>
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={() => setEditUser({ ...u })}
                    >
                      <Edit size={14} /> {txt.edit}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => setDeleteUserId(u.id)}
                    >
                      <Trash2 size={14} /> {txt.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* PDPA MANAGEMENT */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FileLock size={18} /> {txt.pdpa}
        </h2>

        <div className={styles.cardGrid}>
          {(
            [
              ["econsent", "Set dynamic e-Consent / Withdrawal / Legal representative"],
              ["templates", "Templates & Purpose (Clinical/Research)"],
              ["retention", "Retention Policy (days/years)"],
              ["dpia", "DPIA assessment"],
              ["rop", "Records of Processing"],
              ["breach", "Data Breach workflow"],
            ] as [PDPAItemKey, string][]
          ).map(([key, desc]) => (
            <div key={key} className={styles.card}>
              <div className={styles.cardTitle}>{pdpaMap[key]}</div>
              <div className={styles.cardDesc}>
                {lang === "en" ? desc : "ตั้งค่าและจัดการตามข้อกำหนด PDPA"}
              </div>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setPdpaModal(key)}
              >
                <Settings size={16} /> {txt.cfg}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* INTEGRATION */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Link size={18} /> {txt.integ}
        </h2>

        <div className={styles.cardGrid}>
          {(
            [
              ["his", "HIS/EMR (FHIR/ADT/ORD/ORU)"],
              ["analyzer", "Analyzer (ASTM/HL7)"],
              ["external", "External Lab API"],
            ] as [IntegrationKey, string][]
          ).map(([key, label]) => (
            <div key={key} className={styles.card}>
              <div className={styles.cardTitle}>{label}</div>
              <div className={styles.cardDesc}>
                {lang === "en" ? "Connection configuration and status." : "ตั้งค่าและสถานะการเชื่อมต่อ"}
              </div>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  setIntegrationForm({ endpoint: "", token: "", status: "Disconnected" });
                  setIntegrationModal(key);
                }}
              >
                <Settings size={16} /> {txt.cfg}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SYSTEM SETTINGS */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Settings size={18} /> {txt.sys}
        </h2>
        <div className={styles.row}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setSysModal(true)}>
            <Settings size={16} /> {lang === "en" ? "Open settings" : "เปิดการตั้งค่า"}
          </button>
        </div>
      </div>

      {/* LICENSE & TT */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Key size={18} /> {txt.license}
        </h2>
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>{lang === "en" ? "License Terms" : "ข้อกำหนดสิทธิ์การใช้งาน"}</div>
            <div className={styles.cardDesc}>
              {lang === "en" ? "View or renew license." : "ดูหรือดำเนินการต่ออายุ"}
            </div>
            <div className={styles.row}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setLicenseModal(true)}>
                <FileText size={16} /> {lang === "en" ? "View" : "ดูรายละเอียด"}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => alert("Renew (mock)")}>
                <Download size={16} /> {lang === "en" ? "Renew" : "ต่ออายุ"}
              </button>
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>{lang === "en" ? "Technology Transfer" : "ถ่ายทอดเทคโนโลยี"}</div>
            <div className={styles.cardDesc}>
              {lang === "en" ? "Support for TT and collaboration." : "สนับสนุนการถ่ายทอดเทคโนโลยีและความร่วมมือ"}
            </div>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => alert("Open TT module (mock)")}>
              <Settings size={16} /> {lang === "en" ? "Open Module" : "เปิดโมดูล"}
            </button>
          </div>
        </div>
      </div>

      {/* AUDIT LOG */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <FileText size={18} /> {txt.audit}
        </h2>
        <div className={styles.tableBox}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>{lang === "en" ? "Action" : "การกระทำ"}</th>
                <th>{lang === "en" ? "Timestamp" : "เวลา"}</th>
                <th>{lang === "en" ? "View" : "ดู"}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.user}</td>
                  <td>{l.action}</td>
                  <td>{l.timestamp}</td>
                  <td>
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setViewLog(l)}>
                      <FileText size={14} /> {lang === "en" ? "Detail" : "รายละเอียด"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* Add user */}
      {showAddUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{lang === "en" ? "Add User" : "เพิ่มผู้ใช้"}</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowAddUser(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                className={styles.input}
                placeholder={lang === "en" ? "First name" : "ชื่อ"}
                value={newUser.fname}
                onChange={(e) => setNewUser((u) => ({ ...u, fname: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder={lang === "en" ? "Last name" : "นามสกุล"}
                value={newUser.lname}
                onChange={(e) => setNewUser((u) => ({ ...u, lname: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder={lang === "en" ? "Hospital" : "โรงพยาบาล"}
                value={newUser.hospital ?? ""}
                onChange={(e) => setNewUser((u) => ({ ...u, hospital: e.target.value }))}
              />
              {addError && <div className={styles.error}>{addError}</div>}
              <select
                className={styles.select}
                value={newUser.role}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, role: e.target.value as User["role"] }))
                }
              >
                {(["Admin","Doctor","MedTech","Pharmacist"] as RoleOption[]).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowAddUser(false)}>
                {txt.cancel}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveNewUser} disabled={adding}>
                <Save size={16} /> {adding ? (lang === "en" ? "Saving..." : "กำลังบันทึก...") : txt.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPwd && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{lang === "en" ? "Reset Password" : "รีเซ็ตรหัสผ่าน"}</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowResetPwd(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {resetStep === "verify" && (
                <>
                  <input
                    className={styles.input}
                    placeholder={lang === "en" ? "Staff Email" : "อีเมลผู้ใช้"}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={resetBusy}
                    onClick={verifyResetEmail}
                    style={{ marginTop: ".5rem" }}
                  >
                    {resetBusy ? (lang === "en" ? "Checking..." : "กำลังตรวจสอบ...") : (lang === "en" ? "Verify" : "ตรวจสอบ")}
                  </button>
                </>
              )}
              {resetStep === "set" && resetTarget && (
                <>
                  <div className={styles.badge}>
                    {resetTarget.Fname} {resetTarget.Lname} ({resetTarget.email})
                  </div>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder={lang === "en" ? "New Password" : "รหัสผ่านใหม่"}
                    value={resetPwd}
                    onChange={(e) => setResetPwd(e.target.value)}
                  />
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={resetBusy}
                    onClick={submitResetPassword}
                    style={{ marginTop: ".5rem" }}
                  >
                    {resetBusy ? (lang === "en" ? "Saving..." : "กำลังบันทึก...") : (lang === "en" ? "Save Password" : "บันทึกรหัสผ่าน")}
                  </button>
                </>
              )}
              {resetError && <div className={styles.error} style={{ marginTop: ".5rem" }}>{resetError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowResetPwd(false)}>
                {txt.cancel}
              </button>
              {resetStep === "set" && (
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={submitResetPassword} disabled={resetBusy}>
                  <Save size={16} /> {resetBusy ? (lang === "en" ? "Saving..." : "กำลังบันทึก...") : txt.save}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit user */}
      {editUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{lang === "en" ? "Edit User" : "แก้ไขผู้ใช้"}</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setEditUser(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                className={styles.input}
                placeholder={lang === "en" ? "First name" : "ชื่อ"}
                value={editUser.fname}
                onChange={(e) => setEditUser({ ...editUser, fname: e.target.value })}
              />
              <input
                className={styles.input}
                placeholder={lang === "en" ? "Last name" : "นามสกุล"}
                value={editUser.lname}
                onChange={(e) => setEditUser({ ...editUser, lname: e.target.value })}
              />
              <input
                className={styles.input}
                placeholder="Email"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              />
              <select
                className={styles.select}
                value={editUser.role}
                onChange={(e) =>
                  setEditUser({ ...editUser, role: e.target.value as User["role"] })
                }
              >
                {(["Admin","Doctor","MedTech","Pharmacist"] as RoleOption[]).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setEditUser(null)}>
                {txt.cancel}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveEditUser}>
                <Save size={16} /> {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteUserId !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{lang === "en" ? "Confirm delete" : "ยืนยันการลบ"}</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setDeleteUserId(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {lang === "en" ? "Remove this user?" : "ต้องการลบผู้ใช้นี้หรือไม่?"}
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setDeleteUserId(null)}>
                {txt.cancel}
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={confirmDelete}>
                <Trash2 size={16} /> {txt.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDPA config modal */}
      {pdpaModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{pdpaMap[pdpaModal]}</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setPdpaModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                className={styles.input}
                placeholder="Version"
                value={pdpaConfig.version ?? ""}
                onChange={(e) => setPdpaConfig((c) => ({ ...c, version: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder={lang === "en" ? "Purpose / Objective" : "วัตถุประสงค์"}
                value={pdpaConfig.purpose ?? ""}
                onChange={(e) => setPdpaConfig((c) => ({ ...c, purpose: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder={lang === "en" ? "Retention (days)" : "ระยะเวลาเก็บรักษา (วัน)"}
                type="number"
                value={pdpaConfig.retentionDays ?? 0}
                onChange={(e) =>
                  setPdpaConfig((c) => ({ ...c, retentionDays: Number(e.target.value) }))
                }
              />
              <textarea
                className={`${styles.textarea}`}
                placeholder={lang === "en" ? "Notes" : "หมายเหตุ"}
                value={pdpaConfig.note ?? ""}
                onChange={(e) => setPdpaConfig((c) => ({ ...c, note: e.target.value }))}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setPdpaModal(null)}>
                {txt.cancel}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={savePdpa}>
                <Save size={16} /> {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integration modal */}
      {integrationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {integrationModal === "his"
                  ? "HIS/EMR"
                  : integrationModal === "analyzer"
                  ? "Analyzer"
                  : "External API"}
              </div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setIntegrationModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                className={styles.input}
                placeholder="Endpoint URL"
                value={integrationForm.endpoint}
                onChange={(e) => setIntegrationForm((f) => ({ ...f, endpoint: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder="Access Token"
                value={integrationForm.token}
                onChange={(e) => setIntegrationForm((f) => ({ ...f, token: e.target.value }))}
              />
              <div className={styles.badge}>Status: {integrationForm.status}</div>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setIntegrationModal(null)}>
                {txt.cancel}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveIntegration}>
                <Save size={16} /> {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System settings modal */}
      {sysModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{txt.sys}</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setSysModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                type="file"
                className={styles.input}
                onChange={(e) => setLogoFile(e.target.files?.[0]?.name ?? "")}
              />
              {logoFile && <div className={styles.badge}>Logo: {logoFile}</div>}
              <input
                className={styles.input}
                placeholder={lang === "en" ? "ISO Message" : "ข้อความ ISO"}
                value={isoMessage}
                onChange={(e) => setIsoMessage(e.target.value)}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setSysModal(false)}>
                {txt.cancel}
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => setSysModal(false)}
              >
                <Save size={16} /> {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License modal */}
      {licenseModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{lang === "en" ? "License Terms" : "ข้อกำหนดสิทธิ์การใช้งาน"}</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setLicenseModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ lineHeight: 1.6 }}>
                <strong>SWU-PGx</strong> — {lang === "en" ? "Internal-use license (mock)" : "สิทธิ์การใช้งานภายใน (จำลอง)"}<br/>
                {lang === "en" ? "Not for commercial use. Redistribution prohibited." : "ห้ามใช้เชิงพาณิชย์และห้ามเผยแพร่ต่อ"}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setLicenseModal(false)}>
                {txt.cancel}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setLicenseModal(false)}>
                <Download size={16} /> PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit view */}
      {viewLog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Audit</div>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setViewLog(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div><strong>User:</strong> {viewLog.user}</div>
              <div><strong>Action:</strong> {viewLog.action}</div>
              <div><strong>Time:</strong> {viewLog.timestamp}</div>
              <textarea
                className={styles.textarea}
                placeholder={lang === "en" ? "Comment (mock)" : "หมายเหตุ (จำลอง)"}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setViewLog(null)}>
                {txt.cancel}
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setViewLog(null)}>
                <Save size={16} /> {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}