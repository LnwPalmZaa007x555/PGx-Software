"use client";

import { useState } from "react";
import styles from "./page.module.css";
import {
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Save,
  X,
  Search,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminUserManagement() {
  const { language } = useLanguage();

  const [users, setUsers] = useState([
    {
      id: 1,
      firstName: "Anucha",
      lastName: "Kittisak",
      email: "anucha@hospital.com",
      password: "123456",
      role: "Physician",
      hospital: "Ramathibodi Hospital",
    },
    {
      id: 2,
      firstName: "Mali",
      lastName: "Siriwan",
      email: "mali@hospital.com",
      password: "pass789",
      role: "Pharmacist",
      hospital: "Siriraj Hospital",
    },
    {
      id: 3,
      firstName: "Bee",
      lastName: "Wongchai",
      email: "bee@hospital.com",
      password: "data999",
      role: "Data Entry",
      hospital: "Bangkok Hospital",
    },
  ]);

  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    hospital: "",
  });
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");

  // Filter
  const filteredUsers = users.filter((u) => {
    const matchRole = filterRole === "All" || u.role === filterRole;
    const matchName = u.firstName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchRole && matchName;
  });

  const validateUser = (user: any) =>
    user.firstName.trim() &&
    user.lastName.trim() &&
    user.email.trim() &&
    user.password.trim() &&
    user.role.trim() &&
    user.hospital.trim();

  const handleAddUser = () => {
    if (!validateUser(newUser)) {
      setError(
        language === "en"
          ? "⚠️ Please fill in all fields before saving."
          : "⚠️ กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก"
      );
      return;
    }
    const newId = Date.now();
    setUsers((prev) => [...prev, { id: newId, ...newUser }]);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
      hospital: "",
    });
    setError("");
    setShowAddModal(false);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setError("");
  };

  const handleSaveEdit = () => {
    if (!validateUser(selectedUser)) {
      setError(
        language === "en"
          ? "⚠️ Please fill in all fields before saving."
          : "⚠️ กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก"
      );
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? selectedUser : u))
    );
    setError("");
    setShowEditModal(false);
  };

  const handleDeleteUser = (id: number) => {
    if (
      confirm(
        language === "en"
          ? "Delete this user?"
          : "คุณต้องการลบผู้ใช้นี้หรือไม่?"
      )
    ) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const toggleShowPassword = (id: number) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // =================== Render ===================
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {language === "en" ? "User Management" : "จัดการผู้ใช้"}
      </h1>
      <p className={styles.subtitle}>
        {language === "en"
          ? "Add, search, and manage users with full admin control"
          : "เพิ่ม ค้นหา และจัดการผู้ใช้ได้อย่างสมบูรณ์"}
      </p>

      {/* Filter + Search */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label>
            {language === "en" ? "Filter by Role:" : "กรองตามบทบาท:"}
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={styles.selectSmall}
          >
            <option value="All">{language === "en" ? "All" : "ทั้งหมด"}</option>
            <option value="Physician">
              {language === "en" ? "Physician" : "แพทย์"}
            </option>
            <option value="Pharmacist">
              {language === "en" ? "Pharmacist" : "เภสัชกร"}
            </option>
            <option value="Data Entry">
              {language === "en" ? "Data Entry" : "เจ้าหน้าที่บันทึกข้อมูล"}
            </option>
            <option value="Admin">
              {language === "en" ? "Admin" : "ผู้ดูแลระบบ"}
            </option>
          </select>
        </div>

        <div className={styles.searchGroup}>
          <Search size={16} />
          <input
            type="text"
            placeholder={
              language === "en"
                ? "Search by first name..."
                : "ค้นหาด้วยชื่อ..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <button onClick={() => setShowAddModal(true)} className={styles.addBtn}>
          <Plus size={16} />{" "}
          {language === "en" ? "Add User" : "เพิ่มผู้ใช้"}
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableBox}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{language === "en" ? "Full Name" : "ชื่อ-นามสกุล"}</th>
              <th>Email</th>
              <th>{language === "en" ? "Password" : "รหัสผ่าน"}</th>
              <th>{language === "en" ? "Role" : "บทบาท"}</th>
              <th>{language === "en" ? "Hospital" : "โรงพยาบาล"}</th>
              <th>{language === "en" ? "Actions" : "การจัดการ"}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>
                  {showPassword[u.id] ? u.password : "••••••"}
                  <button
                    className={styles.iconBtn}
                    onClick={() => toggleShowPassword(u.id)}
                    title={
                      language === "en"
                        ? "Show Password"
                        : "แสดงรหัสผ่าน"
                    }
                  >
                    {showPassword[u.id] ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>
                </td>
                  <td>
                    {u.role === "Physician" && (language === "en" ? "Physician" : "แพทย์")}
                    {u.role === "Pharmacist" && (language === "en" ? "Pharmacist" : "เภสัชกร")}
                    {u.role === "Data Entry" && (language === "en" ? "Data Entry" : "เจ้าหน้าที่บันทึกข้อมูล")}
                    {u.role === "Admin" && (language === "en" ? "Admin" : "ผู้ดูแลระบบ")}
                  </td>
                <td>{u.hospital}</td>
                <td>
                  <button
                    className={styles.iconBtn}
                    title={language === "en" ? "Edit User" : "แก้ไขผู้ใช้"}
                    onClick={() => handleEditUser(u)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    title={language === "en" ? "Delete User" : "ลบผู้ใช้"}
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{language === "en" ? "Add New User" : "เพิ่มผู้ใช้ใหม่"}</h3>
            {error && (
              <p className={styles.errorText}>
                <AlertCircle size={16} /> {error}
              </p>
            )}
            <label>{language === "en" ? "First Name" : "ชื่อ"}</label>
            <input
              type="text"
              value={newUser.firstName}
              onChange={(e) =>
                setNewUser({ ...newUser, firstName: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Last Name" : "นามสกุล"}</label>
            <input
              type="text"
              value={newUser.lastName}
              onChange={(e) =>
                setNewUser({ ...newUser, lastName: e.target.value })
              }
              className={styles.input}
            />
            <label>Email</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Password" : "รหัสผ่าน"}</label>
            <input
              type="text"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Hospital" : "โรงพยาบาล"}</label>
            <input
              type="text"
              value={newUser.hospital}
              onChange={(e) =>
                setNewUser({ ...newUser, hospital: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Role" : "บทบาท"}</label>
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value })
              }
              className={styles.select}
            >
              <option value="">
                {language === "en" ? "Select Role" : "เลือกบทบาท"}
              </option>
              <option value="Physician">
                {language === "en" ? "Physician" : "แพทย์"}
              </option>
              <option value="Pharmacist">
                {language === "en" ? "Pharmacist" : "เภสัชกร"}
              </option>
              <option value="Data Entry">
                {language === "en" ? "Data Entry" : "เจ้าหน้าที่บันทึกข้อมูล"}
              </option>
              <option value="Admin">
                {language === "en" ? "Admin" : "ผู้ดูแลระบบ"}
              </option>
            </select>

            <div className={styles.modalButtons}>
              <button onClick={handleAddUser} className={styles.saveBtn}>
                <Save size={16} /> {language === "en" ? "Save" : "บันทึก"}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className={styles.cancelBtn}
              >
                <X size={16} /> {language === "en" ? "Cancel" : "ยกเลิก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{language === "en" ? "Edit User" : "แก้ไขผู้ใช้"}</h3>
            {error && (
              <p className={styles.errorText}>
                <AlertCircle size={16} /> {error}
              </p>
            )}
            <label>{language === "en" ? "First Name" : "ชื่อ"}</label>
            <input
              type="text"
              value={selectedUser.firstName}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, firstName: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Last Name" : "นามสกุล"}</label>
            <input
              type="text"
              value={selectedUser.lastName}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, lastName: e.target.value })
              }
              className={styles.input}
            />
            <label>Email</label>
            <input
              type="email"
              value={selectedUser.email}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, email: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Password" : "รหัสผ่าน"}</label>
            <input
              type="text"
              value={selectedUser.password}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, password: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Hospital" : "โรงพยาบาล"}</label>
            <input
              type="text"
              value={selectedUser.hospital}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, hospital: e.target.value })
              }
              className={styles.input}
            />
            <label>{language === "en" ? "Role" : "บทบาท"}</label>
            <select
              value={selectedUser.role}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, role: e.target.value })
              }
              className={styles.select}
            >
              <option value="Physician">
                {language === "en" ? "Physician" : "แพทย์"}
              </option>
              <option value="Pharmacist">
                {language === "en" ? "Pharmacist" : "เภสัชกร"}
              </option>
              <option value="Data Entry">
                {language === "en" ? "Data Entry" : "เจ้าหน้าที่บันทึกข้อมูล"}
              </option>
              <option value="Admin">
                {language === "en" ? "Admin" : "ผู้ดูแลระบบ"}
              </option>
            </select>

            <div className={styles.modalButtons}>
              <button onClick={handleSaveEdit} className={styles.saveBtn}>
                <Save size={16} /> {language === "en" ? "Save" : "บันทึก"}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.cancelBtn}
              >
                <X size={16} /> {language === "en" ? "Cancel" : "ยกเลิก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
