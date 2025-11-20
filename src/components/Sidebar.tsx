"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Dna,
  ShieldUser,
  FlaskConical,
  BookOpen,
  BarChart3,
  Database,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./Sidebar.module.css";
<<<<<<< HEAD
import { meRequest, logout as doLogout } from "@/utils/auth";

type MenuItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  /** ถ้ากำหนด role -> เฉพาะ role นี้เท่านั้นที่มองเห็นเมนู */
  role?: "admin" | "doctor" | "pharmacist" | "medtech";
};
=======
import { meRequest, logout, type LoginResponse } from "@/utils/auth";
>>>>>>> Endplease

const Sidebar = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

<<<<<<< HEAD
  // ✅ ดึงข้อมูลผู้ใช้จริงจาก /auth/me เพื่อใช้ role กรองเมนู
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string; hospital: string; email: string } | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
=======
  // check current user's role to show Admin Panel only for admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
>>>>>>> Endplease
  useEffect(() => {
    (async () => {
      try {
        const me = await meRequest();
<<<<<<< HEAD
        setUser({
          firstName: me.Fname,
          lastName: me.Lname,
          role: (me.Role || "").toLowerCase(),
          hospital: me.Hospital_Name,
          email: me.email,
        });
      } catch (e: any) {
        setUserError(e?.response?.data?.error || e?.message || "Failed to load user");
        setUser({ firstName: "", lastName: "", role: "", hospital: "", email: "" });
=======
        setIsAdmin(String(me.Role || "").toLowerCase() === "admin");
        setUser(me);
      } catch {
        setIsAdmin(false);
        setUser(null);
>>>>>>> Endplease
      }
    })();
  }, []);

  const handleLogout = () => {
<<<<<<< HEAD
    doLogout();
    router.push("/login");
  };

  // 🌍 เมนูหลัก (กำหนด role เฉพาะรายการที่ต้องการจำกัดสิทธิ์)
  const baseMenu: MenuItem[] = [
=======
    logout();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  // who can see Approve menu
  const canSeeApprove = ["admin", "doctor", "pharmacist"].includes(
    String(user?.Role || "").toLowerCase()
  );

  // 🌍 เมนูหลักของ PGx Platform
  const menu = [
>>>>>>> Endplease
    {
      name: language === "en" ? "Dashboard" : "หน้าหลัก",
      path: "/dashboard",
      icon: <LayoutDashboard size={22} />,
    },
    {
      name: language === "en" ? "Case Management" : "การจัดการเคส",
      path: "/case",
      icon: <Users size={22} />,
    },
    {
      name: language === "en" ? "Gene Entry" : "กรอกข้อมูลยีน",
      path: "/gene",
      icon: <Dna size={22} />,
    },
<<<<<<< HEAD
    {
      name: language === "en" ? "Approve" : "อนุมัติผล",
      path: "/approve",
      icon: <ClipboardCheck size={22} />,
    },
=======
    ...(
      canSeeApprove
        ? [
            {
              name: language === "en" ? "Approve" : "กรอกข้อมูลยีน",
              path: "/approve",
              icon: <ClipboardCheck size={22} />,
            },
          ]
        : []
    ),
>>>>>>> Endplease
    {
      name: language === "en" ? "Specimen Accessioning" : "รับสิ่งส่งตรวจ",
      path: "/specimen",
      icon: <FlaskConical size={22} />,
    },
    {
      name: language === "en" ? "Knowledge & Info" : "คลังข้อมูล",
      path: "/knowledge",
      icon: <BookOpen size={22} />,
    },
    {
      name: language === "en" ? "QC & Training" : "ควบคุมคุณภาพและอบรม",
      path: "/qc",
      icon: <Database size={22} />,
    },
    {
      name: language === "en" ? "Reports & Analytics" : "รายงานและสถิติ",
      path: "/reports",
      icon: <BarChart3 size={22} />,
    },
<<<<<<< HEAD
    {
      name: language === "en" ? "Admin Panel" : "การตั้งค่าระบบ",
      path: "/admin",
      icon: <ShieldUser size={22} />,
      role: "admin", // 🔒 แสดงเฉพาะผู้ใช้ role 'admin'
    },
=======
    // Admin Panel (admin only)
    ...(
      isAdmin
        ? [
            {
              name: language === "en" ? "Admin Panel" : "การตั้งค่าระบบ",
              path: "/admin",
              icon: <ShieldUser size={22} />,
            },
          ]
        : []
    ),
>>>>>>> Endplease
    {
      name: language === "en" ? "Settings" : "การตั้งค่า",
      path: "/settings",
      icon: <Settings size={22} />,
    },
  ];

  // ✅ กรองเมนูตามสิทธิ์ผู้ใช้
  const menu = baseMenu.filter((item) => {
    if (!item.role) return true; // เมนูที่ไม่กำหนด role -> ทุกคนเห็น
    const role = (user?.role || "").toLowerCase();
    return role === item.role.toLowerCase();
  });

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ""}`}>
      {/* Header */}
      <div className={styles.topBar}>
        <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
          <span className={styles.iconWrapper}>
            {mounted ? (isOpen ? <X size={22} /> : <Menu size={22} />) : null}
          </span>
          <span
            className={`${styles.linkText} ${
              !isOpen ? styles.textCollapsed : ""
            }`}
          >
            PGx Platform
          </span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.menuWrapper}>
        <ul className={styles.menu}>
          {menu.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`${styles.link} ${
                  pathname.startsWith(item.path) ? styles.active : ""
                }`}
              >
                <span className={styles.iconWrapper}>{item.icon}</span>
                <span
                  className={`${styles.linkText} ${
                    !isOpen ? styles.textCollapsed : ""
                  }`}
                >
                  {item.name}
                </span>
                {!isOpen && <span className={styles.tooltip}>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* My Profile (Display only) */}
      <div className={styles.profileWrapper}>
        <div className={styles.profileDisplay}>
          <div
<<<<<<< HEAD
            className={`${styles.profileInfo} ${
              !isOpen ? styles.textCollapsed : ""
            }`}
=======
            className={`${styles.profileInfo} ${!isOpen ? styles.textCollapsed : ""}`}
>>>>>>> Endplease
          >
            {user ? (
              <>
                <p className={styles.profileName}>
<<<<<<< HEAD
                  {user.firstName} {user.lastName}
                </p>
                <p className={styles.profileRole}>{user.role || ""}</p>
                <p className={styles.profileRole}>{user.hospital}</p>
=======
                  {user.Fname} {user.Lname}
                </p>
                <p className={styles.profileRole}>{user.Role || ""}</p>
                <p className={styles.profileRole}>{user.Hospital_Name}</p>
>>>>>>> Endplease
                <p className={styles.profileEmail}>{user.email}</p>
              </>
            ) : (
              <p className={styles.profileEmail}>
                {language === "en" ? "Loading user..." : "กำลังโหลดผู้ใช้..."}
              </p>
            )}
          </div>
        </div>
<<<<<<< HEAD
      </div>
=======
    </div>
>>>>>>> Endplease

      {/* Logout Button */}
      <div className={styles.logoutWrapper}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <span className={styles.iconWrapper}>
            <LogOut size={22} />
          </span>
          <span
            className={`${styles.linkText} ${
              !isOpen ? styles.textCollapsed : ""
            }`}
          >
            {language === "en" ? "Logout" : "ออกจากระบบ"}
          </span>
          {!isOpen && (
            <span className={styles.tooltip}>
              {language === "en" ? "Logout" : "ออกจากระบบ"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
