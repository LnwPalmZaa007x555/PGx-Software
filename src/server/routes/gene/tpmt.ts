import { Router } from "express";
import { createTPMT, deleteTPMTById, getTPMT, getTPMTById, saveToResult, updateTPMTById } from "../../controllers/gene/tpmt";


const router = Router();

router.get("/", getTPMT);
router.get("/:id", getTPMTById);
router.post("/", createTPMT);
router.put("/:id", updateTPMTById);
router.delete("/:id", deleteTPMTById);
router.post("/save", saveToResult);

export default router;
