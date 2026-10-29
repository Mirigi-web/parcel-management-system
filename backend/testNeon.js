
require("dotenv").config();

const pool = require("./db");

async function checkDatabase() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        inet_server_addr() AS server_address,
        inet_server_port() AS server_port,
        version() AS postgres_version
    `);

    console.log("Database:", result.rows[0].database_name);
    console.log("User:", result.rows[0].database_user);
    console.log("Server address:", result.rows[0].server_address);
    console.log("Server port:", result.rows[0].server_port);
    console.log("PostgreSQL version:", result.rows[0].postgres_version);
  } catch (error) {
    console.error("Connection check failed:", error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
