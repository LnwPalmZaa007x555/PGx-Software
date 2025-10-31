import { Router } from "express";
import { createCYP2D6, deleteCYP2D6ById, getCYP2D6, getCYP2D6ById, saveToResult, updateCYP2D6ById } from "../../controllers/gene/cyp2d6";

const router = Router();

router.get("/", getCYP2D6);
router.get("/:id", getCYP2D6ById);
router.post("/", createCYP2D6);
router.put("/:id", updateCYP2D6ById);
router.delete("/:id", deleteCYP2D6ById);
router.post("/save", saveToResult);

export default router;
