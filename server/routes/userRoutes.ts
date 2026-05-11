import { Router } from "express";
import { createUser, getMe } from "../controllers/userController.js";
import { requireSession } from "../middleware/session.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// POST /api/users — Create guest user (no session required)
router.post("/", asyncHandler(createUser));

// GET /api/users/me — Get current user (session required)
router.get("/me", requireSession, asyncHandler(getMe));

export default router;
