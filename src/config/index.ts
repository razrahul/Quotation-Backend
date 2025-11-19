import fs from "fs";
import path from "path";
import dotenv from "dotenv";

export type Env = "development" | "staging" | "production";

const env: Env = (process.env.NODE_ENV as Env) || "development";

function loadEnvFile(e: Env) {
  const candidates = [
    `.env.${e}`,
    `.env.devlopment` // fallback for possible typo in older projects
  ];

  for (const name of candidates) {
    const p = path.resolve(process.cwd(), name);
    if (fs.existsSync(p)) {
      const result = dotenv.config({ path: p });
      if (result.error) throw result.error;
      console.log(`Loaded env file: ${name}`);
      return;
    }
  }
  console.warn(`No env file found for ${e}. Relying on process.env.`);
}

loadEnvFile(env);

export const config = {
  env,
  port: process.env.PORT ? Number(process.env.PORT) : env === "production" ? 8000 : 4000,
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || `techtime_${env}`,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: "mysql"
  }
};
