import express from "express";
import authRouter from "./auth.routes";
import quoteRouter from "./quote.routes";



const router = express.Router();

router.use("/auth", authRouter);
router.use("/quote", quoteRouter);




export default router;