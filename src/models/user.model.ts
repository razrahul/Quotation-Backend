// src/models/user.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/dbConnect";

interface UserAttributes {
  id: number;
  name?: string;
  email?: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;
  public name?: string;
  public email?: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false }
  },
  {
    sequelize,
    tableName: "usersQuotes",
    timestamps: true
  }
);

export default User;
