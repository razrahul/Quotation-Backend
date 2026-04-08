// src/models/index.ts
// Import models so they register on the single sequelize instance.
import "./user.model";
import "./quote.model";
import "./download.model";
import "./quoteAsset.model";

import sequelize from "../config/dbConnect";
import User from "./user.model";
import Quote from "./quote.model";
import DownloadLog from "./download.model";
import QuoteAsset from "./quoteAsset.model";

// export for app use
export { sequelize, User, Quote, DownloadLog, QuoteAsset };

export default sequelize;
