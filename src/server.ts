// src/server.ts
import path from "path";
import dotenv from "dotenv";

const nodeEnv = (process.env.NODE_ENV || "development").trim();
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
console.log("NODE_ENV:", nodeEnv);

import app from "./app"; // if no app.ts, create one or use express directly below

import { sequelize } from "./models"; // models/index imports models and exports sequelize

import "./associations";

import { tableSync } from "./utils/tableSync";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

(async () => {
  try {
    await sequelize.authenticate(); // runs auth according to env
    await tableSync(); // runs sync according to env

    // 6) start server after successful sync/auth
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT} (env=${nodeEnv})`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();
