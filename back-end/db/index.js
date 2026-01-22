const { Pool, types } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env.azure") });

// Parse arrays as arrays instead of strings
types.setTypeParser(1009, (val) => val); // text[]
types.setTypeParser(1016, (val) => val); // int4[]
types.setTypeParser(1231, (val) => val); // numeric[]

const pool = new Pool({
  user: process.env.MAIN_DB_USER,
  password: process.env.MAIN_DB_PASSWORD,
  host: process.env.MAIN_DB_HOST,
  port: process.env.MAIN_DB_PORT,
  database: process.env.MAIN_DB_NAME,
});

const backupPool = new Pool({
  user: process.env.BACKUP_DB_USER,
  password: process.env.BACKUP_DB_PASSWORD,
  host: process.env.BACKUP_DB_HOST,
  port: process.env.BACKUP_DB_PORT,
  database: process.env.BACKUP_DB_NAME,
});

pool.connect()
  .then(() => console.log("Connected to main PostgreSQL DB"))
  .catch((err) => console.error("Main DB connection error:", err));

backupPool.connect()
  .then(() => console.log("Connected to backup PostgreSQL DB"))
  .catch((err) => console.error("Backup DB connection error:", err));

module.exports = { pool, backupPool };
