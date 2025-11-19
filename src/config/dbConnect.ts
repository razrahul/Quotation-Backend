import { Sequelize } from "sequelize";
import dbConfig from "./database";
import { config } from "./index";

const env = config.env;
const conf = (dbConfig as any)[env];

const sequelize = new Sequelize(conf.database, conf.username, conf.password, {
  host: conf.host,
  port: conf.port,
  dialect: "mysql",
  logging: conf.logging
});

export default sequelize;
