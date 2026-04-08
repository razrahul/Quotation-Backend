import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dbConnect";

export interface QuoteAssetAttributes {
  id: number;
  quoteId: number;
  kind: "logo" | "signature";
  provider: string;
  url: string;
  publicId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuoteAssetCreationAttributes
  extends Optional<QuoteAssetAttributes, "id" | "publicId" | "metadata" | "createdAt" | "updatedAt"> {}

export class QuoteAsset
  extends Model<QuoteAssetAttributes, QuoteAssetCreationAttributes>
  implements QuoteAssetAttributes
{
  public id!: number;
  public quoteId!: number;
  public kind!: "logo" | "signature";
  public provider!: string;
  public url!: string;
  public publicId!: string | null;
  public metadata!: Record<string, any> | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

QuoteAsset.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    quoteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "quotes",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    kind: {
      type: DataTypes.ENUM("logo", "signature"),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "inline",
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    publicId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "quote_assets",
    timestamps: true,
    indexes: [{ fields: ["quoteId"] }, { fields: ["kind"] }],
  }
);

export default QuoteAsset;
