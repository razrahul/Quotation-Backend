import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRoute from "./routes/health.route";
import indexRouter from "./routes/indexRouter";

const app = express();

// allowed frontend origins from env
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL1,
  process.env.FRONTEND_URL2,
].filter(Boolean);

// CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// body & cookies
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use("/", healthRoute);
app.use("/api/v1", indexRouter);

// global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS policy: origin not allowed",
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

export default app;
