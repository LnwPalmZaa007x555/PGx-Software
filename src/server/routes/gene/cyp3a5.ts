import { Router } from "express";
import { createCYP3A5, deleteCYP3A5ById, getCYP3A5, getCYP3A5ById, saveToResult, updateCYP3A5ById } from "../../controllers/gene/cyp3a5";


const router = Router();

router.get("/", getCYP3A5);
router.get("/:id", getCYP3A5ById);
router.post("/", createCYP3A5);
router.put("/:id", updateCYP3A5ById);
router.delete("/:id", deleteCYP3A5ById);
router.post("/save",saveToResult)

export default router;
