// src/models/quote.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dbConnect";

interface QuoteAttributes {
  id: number;
  userId?: number | null;
  title: string;
  payload: any; // parsed object in JS
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuoteCreationAttributes extends Optional<QuoteAttributes, "id"> {}

export class Quote extends Model<QuoteAttributes, QuoteCreationAttributes> implements QuoteAttributes {
  public id!: number;
  public userId?: number | null;
  public title!: string;
  public payload!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Quote.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    // Use TEXT if DB doesn't support JSON; getter/setter handle conversion
    payload: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      get() {
        const raw = this.getDataValue('payload') as string;
        try {
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return raw;
        }
      },
      set(val: any) {
        // accept object or string
        this.setDataValue('payload', typeof val === 'string' ? val : JSON.stringify(val));
      }
    }
  },
  {
    sequelize,
    tableName: "quotes",
    timestamps: true
  }
);

export default Quote;
