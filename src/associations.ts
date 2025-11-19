// src/associations.ts
import User from "./models/user.model";
import Quote from "./models/quote.model";

// If using default exports from previous files change imports accordingly.
// Example below assumes named/ default; adapt to your exact exports.

User.hasMany(Quote, { foreignKey: "userId", sourceKey: "id", as: "quotes" });
Quote.belongsTo(User, { foreignKey: "userId", targetKey: "id", as: "user" });

console.log("Associations applied: User -> Quote");
