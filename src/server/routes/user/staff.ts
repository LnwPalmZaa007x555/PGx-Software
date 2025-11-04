import { Router } from "express";
import {getStaff,getStaffById,createStaff,updateStaffById,deleteStaffById,}
from "../../controllers/user/staff";
import { auth } from "../../middlewares/auth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

// All staff management routes require authentication and admin role
router.use(auth, requireRole("admin"));

router.get("/", getStaff);
router.get("/:id", getStaffById);
router.post("/", createStaff);
router.put("/:id", updateStaffById);
router.delete("/:id", deleteStaffById);

export default router;
