import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dbConnect";
import { QuotePayload } from "../types/quotePayload";

export type QuoteStatus = "DRAFT" | "FINAL";

export interface QuoteAttributes {
  id: number;
  userId?: number | null;
  quoteNo: string;
  quoteDate: Date;
  status: QuoteStatus;
  currency: string;
  totalAmount: string; // ⚠️ DECIMAL → string
  payload: QuotePayload;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuoteCreationAttributes
  extends Optional<
    QuoteAttributes,
    "id" | "userId" | "status" | "createdAt" | "updatedAt"
  > {}

export class Quote
  extends Model<QuoteAttributes, QuoteCreationAttributes>
  implements QuoteAttributes
{
  public id!: number;
  public userId!: number | null;
  public quoteNo!: string;
  public quoteDate!: Date;
  public status!: QuoteStatus;
  public currency!: string;
  public totalAmount!: string;
  public payload!: QuotePayload;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Quote.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "usersQuotes",
        key: "id",
      },
      onDelete: "SET NULL",
    },

    quoteNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
    },

    quoteDate: {
      type: DataTypes.DATEONLY, // 👈 only date (no time)
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("DRAFT", "FINAL"),
      defaultValue: "DRAFT",
    },

    currency: {
      type: DataTypes.STRING(10),
      defaultValue: "INR",
    },

    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const raw = this.getDataValue("payload");
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        }
        return raw;
      },
    },
  },
  {
    sequelize,
    tableName: "quotes",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["status"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default Quote;
