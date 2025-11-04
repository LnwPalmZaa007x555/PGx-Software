import { Router } from "express";
import { listResults, getResultById, createResult, updateResult, deleteResult, getLatestByPatientWithGene } from "../controllers/result";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth";
import { requireRole } from "../middlewares/requireRole";
import { newResultSchema, updateResultSchema, resultIdParamSchema } from "../schemas/result.schema";

const router = Router();

router.get("/", auth, listResults);
router.get("/:id", auth, validate(resultIdParamSchema), getResultById);
router.get("/by-patient/:patientId/latest", auth, getLatestByPatientWithGene);

const canWrite = ["Admin", "Doctor", "MedTech", "Pharmacist"];

router.post("/", auth, requireRole(canWrite), validate(newResultSchema), createResult);
router.put("/:id", auth, requireRole(canWrite), validate(resultIdParamSchema), validate(updateResultSchema), updateResult);
router.delete("/:id", auth, requireRole(canWrite), validate(resultIdParamSchema), deleteResult);

export default router;
