const { Pool, types } = require("pg");
require("dotenv").config();

// Parse arrays as arrays instead of strings
types.setTypeParser(1009, (val) => val); // text[]
types.setTypeParser(1016, (val) => val); // int4[]
types.setTypeParser(1231, (val) => val); // numeric[]

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("DB connection error:", err));

module.exports = pool;
