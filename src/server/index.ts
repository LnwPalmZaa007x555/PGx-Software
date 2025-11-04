// src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

// --- user routes ---
import patientsRoutes from "./routes/user/patients";
import staffRoutes from "./routes/user/staff";
import adminRoutes from "./routes/user/admin";
import doctorRoutes from "./routes/user/doctor";
import medtechRoutes from "./routes/user/medtech";
import pharmacistRoutes from "./routes/user/pharmacist"; // ✅ fix file name & import

// --- gene routes ---
import vkorc1Routes from "./routes/gene/vkorc1";
import cyp3a5Routes from "./routes/gene/cyp3a5";
import tpmtRoutes from "./routes/gene/tpmt";
import cyp2c9Routes from "./routes/gene/cyp2c9";
import hlabRoutes from "./routes/gene/hlab";
import cyp2d6Routes from "./routes/gene/cyp2d6";
import cyp2c19Routes from "./routes/gene/cyp2c19";
import geneRoutes from "./routes/gene/gene";

//result
import resultRoutes from "./routes/result";

// --- auth ---
import authRoutes from "./routes/auth";
// import { auth } from "./middlewares/auth"; // (optional) use when you need it
// import { requireRole } from "./middlewares/requireRole"; // (optional)

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CORS ---
const FRONTEND_ORIGIN = process.env.ALLOW_ORIGIN || "http://localhost:3000";
app.use(cors({ origin: process.env.ALLOW_ORIGIN || "http://localhost:3000" }));
// --- health check ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development" });
});

// --- mount user routes ---
app.use("/api/patients", patientsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/medtech", medtechRoutes);
app.use("/api/pharmacist", pharmacistRoutes); // ✅ fix path typo from "/api/phamacist"

// --- mount gene routes ---
app.use("/api/vkorc1", vkorc1Routes);
app.use("/api/cyp3a5", cyp3a5Routes);
app.use("/api/tpmt", tpmtRoutes);
app.use("/api/hlab", hlabRoutes);
app.use("/api/cyp2d6", cyp2d6Routes);
app.use("/api/cyp2c9",cyp2c9Routes);
app.use("/api/cyp2c19",cyp2c19Routes);
app.use("/api/gene", geneRoutes);

//result
app.use("/api/results", resultRoutes);

// --- auth ----
app.use("/api/auth", authRoutes);

// --- 404 fallback for unknown API ---- 
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// --- error handler --- เห้ยจะได้ได้ยัง
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server error]", err);
  res.status(500).json({ error: err.message || String(err) });
});

// --- start server ---
const PORT = Number(process.env.PORT) || 3001; // keep 3001 for Next proxy
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

