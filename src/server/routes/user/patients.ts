import { Router } from "express";
import { getPatients, createPatient, getPatientById, deletePatientById, updatePatientById, getDashboard } from "../../controllers/user/patients";

const router = Router();

router.get("/", getPatients);
router.post("/", createPatient);
router.get("/dashboard", getDashboard); // place before ":id" to avoid route conflict
router.get("/:id", getPatientById);
router.delete("/:id", deletePatientById)
router.put("/:id", updatePatientById)

export default router;
