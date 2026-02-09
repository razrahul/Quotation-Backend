// src/routes/auth.routes.ts
import { Router } from "express";
import {
  register,
  login,
  logout,
  profile,
  UpdateProfile,
  deleteAccount,
  updatePassword,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
router.post("/register", register);
router.post("/login", login);

// authenticated
router.post("/logout", logout);
router.get("/me", requireAuth, profile);
router.put("/me", requireAuth, UpdateProfile);
router.delete("/me", requireAuth, deleteAccount);
router.post("/me/password", requireAuth, updatePassword);

export default router;
