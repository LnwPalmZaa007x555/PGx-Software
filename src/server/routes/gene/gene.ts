import { Router } from "express";
import { listGenes } from "../../controllers/gene/gene";

const router = Router();

router.get("/", listGenes);

export default router;
