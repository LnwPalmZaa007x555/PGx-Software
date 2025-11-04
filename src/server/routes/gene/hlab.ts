import { Router } from "express";
import { createHLAB, deleteHLABById, getHLAB, getHLABById, updateHLABById, saveToResult } from "../../controllers/gene/hlab";


const router = Router();

router.get("/", getHLAB);
router.get("/:id", getHLABById);
router.post("/", createHLAB);
router.post("/save", saveToResult);
router.put("/:id", updateHLABById);
router.delete("/:id", deleteHLABById);

export default router;
