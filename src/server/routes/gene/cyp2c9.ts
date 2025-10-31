
import { Router } from "express";
import { createCYP2C9, deleteCYP2C9ById, getCYP2C9, getCYP2C9ById, saveToResult, updateCYP2C9ById } from "../../controllers/gene/cyp2c9";


const router = Router();

router.get("/", getCYP2C9);
router.get("/:id", getCYP2C9ById);
router.post("/", createCYP2C9);
router.put("/:id", updateCYP2C9ById);
router.delete("/:id", deleteCYP2C9ById);
router.post("/save",saveToResult)

export default router;