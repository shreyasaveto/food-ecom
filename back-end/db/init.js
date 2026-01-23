const fs = require("fs");
const path = require("path");
const { pool } = require("./index");

const initDB = async () => {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split the schema into individual statements
    const statements = schema.split(";").filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log("Database tables created successfully");
  } catch (err) {
    console.error("Error creating tables:", err.message);
  } finally {
    process.exit();
  }
};

initDB();