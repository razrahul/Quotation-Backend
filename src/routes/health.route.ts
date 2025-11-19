import { Router } from "express";
import { sequelize } from "../models";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    res.json({ ok: true, db: "connected" ,message: "working propely ok" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err });
  }
});

export default router;
