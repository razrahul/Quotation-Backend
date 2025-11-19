// src/models/download.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dbConnect";

interface DownloadAttributes {
  id: number;
  userId: number;
  quoteId: number;
  downloadedAt?: Date;
}

interface DownloadCreationAttributes extends Optional<DownloadAttributes, "id"> {}

class DownloadLog extends Model<DownloadAttributes, DownloadCreationAttributes> implements DownloadAttributes {
  public id!: number;
  public userId!: number;
  public quoteId!: number;
  public downloadedAt?: Date;
}

DownloadLog.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  quoteId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  downloadedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: "quote_downloads",
  timestamps: false
});

export default DownloadLog;
