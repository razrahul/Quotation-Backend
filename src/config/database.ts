import { config as appConfig } from "./index";

export default {
  development: {
    username: appConfig.db.username,
    password: appConfig.db.password,
    database: appConfig.db.database,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: "mysql",
    logging: console.log
  },
  staging: {
    username: appConfig.db.username,
    password: appConfig.db.password,
    database: appConfig.db.database,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: "mysql",
    logging: console.log
  },
  production: {
    username: appConfig.db.username,
    password: appConfig.db.password,
    database: appConfig.db.database,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: "mysql",
    logging: false
  }
};
