
require("dotenv").config();
const pool = require("./db");

async function testNeonConnection() {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS username,
        inet_server_addr() AS server_ip
    `);

    console.log("Database connection successful!");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testNeonConnection();
