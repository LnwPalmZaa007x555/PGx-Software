"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Patient = {
  idCard: string;
  firstName: string;
  lastName: string;
  sex: string;
  dob: string;
  phone: string;
  ethnicity: string;
  otherEthnicity?: string;
  gene: string;
  markerValues: Record<string, string>;
  genotype: string;
  phenotype: string;
  recommendation?: string;
  // ✅ status type-safe
  status?: "pending_gene" | "pending_approve" | "approved";
};

type PatientContextType = {
  patients: Patient[];
  addPatient: (p: Patient) => void;
  updatePatients: (list: Patient[]) => void; // ✅ new
};

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);

  // ✅ load patients from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("patients");
    if (saved) {
      try {
        setPatients(JSON.parse(saved));
      } catch {
        console.warn("Invalid patients data in localStorage");
      }
    }
  }, []);

  // ✅ keep synced with localStorage
  useEffect(() => {
    localStorage.setItem("patients", JSON.stringify(patients));
  }, [patients]);

  const addPatient = (p: Patient) => {
    setPatients((prev) => [...prev, p]);
  };

  const updatePatients = (updatedList: Patient[]) => {
  setPatients(updatedList);
  localStorage.setItem("patients", JSON.stringify(updatedList));
  };


  return (
    <PatientContext.Provider value={{ patients, addPatient, updatePatients }}>
      {children}
    </PatientContext.Provider>
  );
}

export const usePatients = () => {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatients must be used inside PatientProvider");
  return ctx;
};
