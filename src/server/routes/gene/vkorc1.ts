import { Router } from "express";
import { createVKORC1, deleteVKORC1ById, getVKORC1, getVKORC1ById, saveToResult, updateVKORC1ById } from "../../controllers/gene/vkorc1";


const router = Router();

router.get("/", getVKORC1);
router.get("/:id", getVKORC1ById);
router.post("/", createVKORC1);
router.put("/:id", updateVKORC1ById);
router.delete("/:id", deleteVKORC1ById);
router.post("/save", saveToResult);

export default router;
