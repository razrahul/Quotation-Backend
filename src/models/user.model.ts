// src/models/user.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dbConnect";

interface UserAttributes {
  id: number;
  name?: string;
  country?: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name?: string;
  public country?: string;
  public email!: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: true },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "India",
    },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    sequelize,
    tableName: "usersQuotes",
    timestamps: true,
    paranoid: true, // 👈 soft delete ON
    deletedAt: "deletedAt", // optional but clear
  }
);

export default User;
