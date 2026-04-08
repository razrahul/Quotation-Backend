// // src/utils/tableSync.ts

import User from "../models/user.model";
import Quote from "../models/quote.model";
import { DownloadLog } from "../models";
import QuoteAsset from "../models/quoteAsset.model";

export async function tableSync() {
  

  try {
    await User.sync({ force: false }); //alter: true for new change in model
    await Quote.sync({ force: false }); //alter: true
    await DownloadLog.sync({ force: false }); //alter: true
    await QuoteAsset.sync({ force: false }); //alter: true
  } catch (err: any) {
    console.error("[tableSync] error:", err.message || err);
    throw err;
  }
}







// import sequelize from "../config/dbConnect";

// export async function tableSync() {
//   const env = process.env.NODE_ENV || "development";
//   console.log("[tableSync] environment:", env);

//   try {
//     await sequelize.authenticate();
//     console.log("[tableSync] DB authenticated");

//     if (env === "development") {
//       await sequelize.sync({ alter: true }); // helpful in dev
//       console.log("[tableSync] synced with { alter: true } (development)");
//     } else if (env === "staging") {
//       // Use alter:true for staging if you want auto-update.
//       // If you prefer safer route, use migrations here instead.
//       await sequelize.sync({ force: false });
//       console.log("[tableSync] synced with { alter: true } (staging)");
//     } else {
//       // Production: do not auto sync; prefer migrations.
//       console.log("[tableSync] production detected - skipping automatic sync. Use migrations.");
//     }
//   } catch (err: any) {
//     console.error("[tableSync] error:", err.message || err);
//     throw err;
//   }
// }


