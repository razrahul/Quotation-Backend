// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login, logout, profile } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, profile);

export default router;
