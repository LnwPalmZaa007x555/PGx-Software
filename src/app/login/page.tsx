"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { loginRequest } from "@/utils/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null); // ref สำหรับช่อง password

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        await loginRequest(email, password);
        router.push("/dashboard");
      } catch (err: unknown) {
        const apiErr = (err as { response?: { data?: { error?: unknown } } }).response?.data?.error;
        const msg =
          typeof apiErr === "string"
            ? apiErr
            : err instanceof Error
            ? err.message
            : "Login failed";
        setErrors({ password: msg });
        //palm1@example.com
        //secretpass123
      }
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>PGx Digital Platform</h1>
        <p className={styles.subtitle}>
          Secure Access for Authorized Medical Professionals
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  passwordRef.current?.focus(); // กด Enter ที่ email → ไปช่อง password
                }
              }}
              placeholder=" "
              className={styles.input}
            />
            <label className={styles.label}>Email address</label>
            {errors.email && <p className={styles.error}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(); // กด Enter ที่ password → login
                }
              }}
              placeholder=" "
              className={styles.input}
            />
            <label className={styles.label}>Password</label>
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {errors.password && <p className={styles.error}>{errors.password}</p>}
          </div>

          <button type="submit" className={styles.loginButton}>
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
