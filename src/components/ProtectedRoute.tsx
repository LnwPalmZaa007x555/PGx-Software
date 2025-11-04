"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check token from localStorage only on client
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return; // don't set ready, avoid flashing protected UI
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    // Minimal placeholder while redirecting or checking token
    return <div style={{ padding: 24, color: "#9aa0a6" }}>Loading…</div>;
  }

  return <>{children}</>;
}
