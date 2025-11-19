import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRoute from "./routes/health.route";
import indexRouter from "./routes/indexRouter";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/", healthRoute);
app.use("/api/v1", indexRouter);


app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal error" });
});

export default app;
