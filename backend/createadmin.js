
require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("readline");
const pool = require("./db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  try {
    console.log("\n=== Create Administrator Account ===\n");

    const name = (await ask("Admin full name: ")).trim();
    const email = (await ask("Admin email: ")).trim().toLowerCase();
    const phone = (await ask("Admin phone number: ")).trim();
    const password = await ask("Choose an admin password: ");

    if (!name || !email || !phone || !password) {
      throw new Error("All fields are required.");
    }

    if (password.length < 10) {
      throw new Error("Use a password with at least 10 characters.");
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR phone = $2",
      [email, phone]
    );

    if (existing.rows.length > 0) {
      throw new Error(
        "That email or phone already belongs to an account. No changes were made."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
        (name, email, phone, password_hash, role, branch_id)
       VALUES ($1, $2, $3, $4, 'admin', NULL)
       RETURNING id, name, email, role`,
      [name, email, phone, passwordHash]
    );

    console.log("\nAdmin account created successfully!");
    console.log("Name:", result.rows[0].name);
    console.log("Email:", result.rows[0].email);
    console.log("Role:", result.rows[0].role);
    console.log("\nYou can now sign in through your normal login page.");
  } catch (error) {
    console.error("\nCould not create Admin:", error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
