require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");
const { sendSMS } = require("./services/smsService");
const { initiateStkPush } = require("./services/darajaService");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* =========================================
   ADMIN: STAFF MANAGEMENT
========================================= */

app.get("/api/admin/staff", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.branch_id, u.is_active, u.created_at, b.name AS branch_name
      FROM users u
      LEFT JOIN branches b ON b.id = u.branch_id
      WHERE u.role = 'staff'
      ORDER BY u.created_at DESC NULLS LAST
    `);
    return res.status(200).json({ staff: result.rows });
  } catch (error) {
    console.error("List staff error:", error);
    return res.status(500).json({ message: "Unable to load staff members" });
  }
});

app.post("/api/admin/staff", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { name, email, phone, password, branch_id } = req.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password || !Number.isInteger(Number(branch_id)) || Number(branch_id) <= 0) {
      return res.status(400).json({ message: "Name, email, phone, password and a valid branch are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters" });
    }
    const branch = await pool.query("SELECT id FROM branches WHERE id = $1 AND status = 'Active'", [Number(branch_id)]);
    if (!branch.rows.length) return res.status(400).json({ message: "Select an active branch" });

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1 OR phone = $2", [normalizedEmail, normalizedPhone]);
    if (existing.rows.length) return res.status(409).json({ message: "That email or phone number is already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, branch_id, is_active)
       VALUES ($1, $2, $3, $4, 'staff', $5, TRUE)
       RETURNING id, name, email, phone, role, branch_id, is_active, created_at`,
      [name.trim(), normalizedEmail, normalizedPhone, passwordHash, Number(branch_id)]
    );
    return res.status(201).json({ message: "Staff account created successfully", staff: result.rows[0] });
  } catch (error) {
    console.error("Create staff error:", error);
    if (error.code === "23505") return res.status(409).json({ message: "That email or phone number is already registered" });
    return res.status(500).json({ message: "Unable to create staff account" });
  }
});

app.put("/api/admin/staff/:id", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const staffId = Number(req.params.id);
    const { name, email, phone, branch_id } = req.body;
    if (!Number.isInteger(staffId) || staffId <= 0 || !name?.trim() || !email?.trim() || !phone?.trim() || !Number.isInteger(Number(branch_id)) || Number(branch_id) <= 0) {
      return res.status(400).json({ message: "Provide valid staff details and branch" });
    }
    const branch = await pool.query("SELECT id FROM branches WHERE id = $1 AND status = 'Active'", [Number(branch_id)]);
    if (!branch.rows.length) return res.status(400).json({ message: "Select an active branch" });

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const duplicate = await pool.query(
      `SELECT id FROM users WHERE (LOWER(email) = $1 OR phone = $2) AND id <> $3`,
      [normalizedEmail, normalizedPhone, staffId]
    );
    if (duplicate.rows.length) return res.status(409).json({ message: "That email or phone number belongs to another account" });

    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2, phone = $3, branch_id = $4
       WHERE id = $5 AND role = 'staff'
       RETURNING id, name, email, phone, role, branch_id, is_active, created_at`,
      [name.trim(), normalizedEmail, normalizedPhone, Number(branch_id), staffId]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Staff member not found" });
    return res.status(200).json({ message: "Staff details updated successfully", staff: result.rows[0] });
  } catch (error) {
    console.error("Update staff error:", error);
    if (error.code === "23505") return res.status(409).json({ message: "That email or phone number is already registered" });
    return res.status(500).json({ message: "Unable to update staff details" });
  }
});

app.patch("/api/admin/staff/:id/status", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const staffId = Number(req.params.id);
    const { is_active } = req.body;
    if (!Number.isInteger(staffId) || staffId <= 0 || typeof is_active !== "boolean") {
      return res.status(400).json({ message: "Provide a valid staff ID and true/false account status" });
    }
    const result = await pool.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 AND role = 'staff'
       RETURNING id, name, email, is_active`,
      [is_active, staffId]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Staff member not found" });
    return res.status(200).json({
      message: is_active ? "Staff account activated" : "Staff account deactivated",
      staff: result.rows[0],
    });
  } catch (error) {
    console.error("Change staff status error:", error);
    return res.status(500).json({ message: "Unable to change staff account status" });
  }
});

/* =========================================
   HOME
========================================= */

app.get("/", (req, res) => {
  res.json({ message: "Parcel Management and Tracking System API is running!" });
});

/* =========================================
   CUSTOMER REGISTRATION
========================================= */

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) return res.status(400).json({ message: "All fields are required" });
    const existingUser = await pool.query(`SELECT id FROM users WHERE email = $1 OR phone = $2`, [email, phone]);
    if (existingUser.rows.length > 0) return res.status(409).json({ message: "Email or phone number already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role, branch_id, created_at`,
      [name, email, phone, passwordHash]
    );
    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   LOGIN
========================================= */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const result = await pool.query(
      `SELECT id, name, email, phone, password_hash, role, branch_id, is_active FROM users WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ message: "Invalid email or password" });
    if (result.rows[0].is_active === false) return res.status(403).json({ message: "Your account has been deactivated. Contact the administrator." });
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign(
      { id: user.id, role: user.role, branch_id: user.branch_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, branch_id: user.branch_id },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   ADMIN: BRANCH MANAGEMENT
========================================= */

app.get("/api/admin/branches", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
    const result = await pool.query(`
      SELECT b.id, b.name, b.location, b.status, ts.prefix,
        COALESCE(staff_counts.staff_count, 0)::int AS staff_count,
        COALESCE(parcel_counts.parcel_count, 0)::int AS parcel_count
      FROM branches b
      LEFT JOIN tracking_sequences ts ON ts.branch_id = b.id
      LEFT JOIN (SELECT branch_id, COUNT(*)::int AS staff_count FROM users WHERE role = 'staff' GROUP BY branch_id) staff_counts ON staff_counts.branch_id = b.id
      LEFT JOIN (SELECT branch_id, COUNT(*)::int AS parcel_count FROM parcels GROUP BY branch_id) parcel_counts ON parcel_counts.branch_id = b.id
      ORDER BY b.name ASC
    `);
    return res.status(200).json({ branches: result.rows });
  } catch (error) {
    console.error("Admin list branches error:", error);
    return res.status(500).json({ message: "Unable to load branches" });
  }
});

app.post("/api/admin/branches", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
    const name = String(req.body.name || "").trim();
    const location = String(req.body.location || "").trim();
    const prefix = String(req.body.prefix || "").trim().toUpperCase();
    if (!name || !location || !/^[A-Z0-9]{3}$/.test(prefix)) return res.status(400).json({ message: "Branch name, location, and a 3-character tracking prefix are required" });

    await client.query("BEGIN");
    const duplicate = await client.query("SELECT id FROM branches WHERE LOWER(name) = LOWER($1)", [name]);
    if (duplicate.rows.length) { await client.query("ROLLBACK"); return res.status(409).json({ message: "A branch with that name already exists" }); }

    const prefixDuplicate = await client.query("SELECT branch_id FROM tracking_sequences WHERE UPPER(prefix) = $1", [prefix]);
    if (prefixDuplicate.rows.length) { await client.query("ROLLBACK"); return res.status(409).json({ message: "That tracking prefix is already in use" }); }

    const created = await client.query(
      `INSERT INTO branches (name, location, status) VALUES ($1, $2, 'Active') RETURNING id, name, location, status`,
      [name, location]
    );
    await client.query(`INSERT INTO tracking_sequences (branch_id, prefix, last_number) VALUES ($1, $2, 0)`, [created.rows[0].id, prefix]);
    await client.query("COMMIT");
    return res.status(201).json({ message: "Branch created successfully", branch: { ...created.rows[0], prefix, staff_count: 0, parcel_count: 0 } });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Admin create branch error:", error);
    if (error.code === "23505") return res.status(409).json({ message: "Branch name or tracking prefix already exists" });
    return res.status(500).json({ message: "Unable to create branch" });
  } finally { client.release(); }
});

app.put("/api/admin/branches/:id", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
    const id = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    const location = String(req.body.location || "").trim();
    const prefix = String(req.body.prefix || "").trim().toUpperCase();
    if (!Number.isInteger(id) || id <= 0 || !name || !location || !/^[A-Z0-9]{3}$/.test(prefix)) return res.status(400).json({ message: "A valid branch ID, name, location, and 3-character tracking prefix are required" });

    await client.query("BEGIN");
    const currentResult = await client.query("SELECT id, name FROM branches WHERE id = $1 FOR UPDATE", [id]);
    if (!currentResult.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Branch not found" }); }

    const current = currentResult.rows[0];
    const duplicate = await client.query("SELECT id FROM branches WHERE LOWER(name) = LOWER($1) AND id <> $2", [name, id]);
    if (duplicate.rows.length) { await client.query("ROLLBACK"); return res.status(409).json({ message: "Another branch already uses that name" }); }

    const prefixDuplicate = await client.query("SELECT branch_id FROM tracking_sequences WHERE UPPER(prefix) = $1 AND branch_id <> $2", [prefix, id]);
    if (prefixDuplicate.rows.length) { await client.query("ROLLBACK"); return res.status(409).json({ message: "That tracking prefix is already in use" }); }

    if (current.name !== name) {
      const parcelReferences = await client.query(
        `SELECT EXISTS (SELECT 1 FROM parcels WHERE branch_id = $1 OR LOWER(destination_branch) = LOWER($2)) AS used`,
        [id, current.name]
      );
      if (parcelReferences.rows[0].used) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "This branch name cannot be changed because existing parcels reference it. You can still edit its location and tracking prefix." });
      }
    }

    const updated = await client.query(
      `UPDATE branches SET name = $1, location = $2 WHERE id = $3 RETURNING id, name, location, status`,
      [name, location, id]
    );
    await client.query(
      `INSERT INTO tracking_sequences (branch_id, prefix, last_number) VALUES ($1, $2, 0)
       ON CONFLICT (branch_id) DO UPDATE SET prefix = EXCLUDED.prefix`,
      [id, prefix]
    );
    await client.query("COMMIT");
    return res.status(200).json({ message: "Branch updated successfully", branch: { ...updated.rows[0], prefix } });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Admin update branch error:", error);
    if (error.code === "23505") return res.status(409).json({ message: "Branch name or tracking prefix already exists" });
    return res.status(500).json({ message: "Unable to update branch" });
  } finally { client.release(); }
});

/* =========================================
   GET BRANCHES — STAFF ONLY
========================================= */

app.get("/api/branches", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") return res.status(403).json({ message: "Only staff members can access branches" });
    const result = await pool.query(`SELECT id, name, location, status FROM branches WHERE status = 'Active' ORDER BY name ASC`);
    res.status(200).json({ branches: result.rows });
  } catch (error) {
    console.error("Branch retrieval error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   GET PARCEL TYPES — STAFF ONLY
========================================= */

app.get("/api/parcel-types", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") return res.status(403).json({ message: "Only staff members can access parcel types" });
    const result = await pool.query(`SELECT id, name, description, status FROM parcel_types WHERE status = 'Active' ORDER BY name ASC`);
    res.status(200).json({ parcelTypes: result.rows });
  } catch (error) {
    console.error("Parcel type retrieval error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   GET CUSTOMERS — STAFF ONLY
========================================= */

app.get("/api/customers", authMiddleware, async (req, res) => {
  try {
    if (!["staff", "admin"].includes(String(req.user.role).toLowerCase())) return res.status(403).json({ message: "Staff or admin access required" });
    const result = await pool.query(`SELECT id, name, email, phone, branch_id, created_at FROM users WHERE role = 'customer' ORDER BY name ASC`);
    res.status(200).json({ customers: result.rows });
  } catch (error) {
    console.error("Customer retrieval error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   ADD CUSTOMER — STAFF ONLY
========================================= */

app.post("/api/customers", authMiddleware, async (req, res) => {
  try {
    if (!["staff", "admin"].includes(String(req.user.role).toLowerCase())) return res.status(403).json({ message: "Staff or admin access required" });
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
    const password = req.body.password ? String(req.body.password) : null;
    if (!name || !phone) return res.status(400).json({ message: "Name and phone are required" });

    const existingPhone = await pool.query("SELECT id, name, phone, role FROM users WHERE phone = $1", [phone]);
    if (existingPhone.rows.length) {
      const existing = existingPhone.rows[0];
      if (existing.role !== "customer") return res.status(409).json({ message: "This phone number belongs to a staff or administrator account" });
      return res.status(200).json({ message: "Existing customer found", customer: existing, reused: true });
    }
    if (email) {
      const existingEmail = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
      if (existingEmail.rows.length) return res.status(409).json({ message: "This email is already registered" });
    }
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, branch_id)
       VALUES ($1, $2, $3, $4, 'customer', $5)
       RETURNING id, name, email, phone, role, branch_id, created_at`,
      [name, email, phone, passwordHash, req.user.branch_id || null]
    );
    return res.status(201).json({ message: "Customer contact saved", customer: result.rows[0] });
  } catch (error) {
    console.error("Add customer error:", error);
    if (error.code === "23505") return res.status(409).json({ message: "That phone or email is already registered" });
    return res.status(500).json({ message: "Unable to save customer contact" });
  }
});

/* =========================================
   CREATE PARCEL — STAFF ONLY + SMS
========================================= */

app.post("/api/parcels", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") return res.status(403).json({ message: "Only staff members can register parcels" });

    const { sender_id, sender_name, sender_phone, recipient_name, recipient_phone, destination_branch, parcel_description, weight, parcel_type_id, items } = req.body;

    const normalizedItems = Array.isArray(items) && items.length
      ? items.map((item) => ({ parcel_type_id: Number(item.parcel_type_id), quantity: Number(item.quantity), description: String(item.description || "").trim() }))
      : [{ parcel_type_id: Number(parcel_type_id), quantity: 1, description: String(parcel_description || "").trim() }];

    if (
      (!sender_id && (!String(sender_name || "").trim() || !String(sender_phone || "").trim())) ||
      !String(recipient_name || "").trim() || !String(recipient_phone || "").trim() ||
      !String(destination_branch || "").trim() ||
      weight === undefined || weight === null || weight === "" ||
      !normalizedItems.length
    ) {
      return res.status(400).json({ message: "Select a customer and destination, enter recipient details and weight, and add at least one parcel item" });
    }

    if (!Number.isFinite(Number(weight)) || Number(weight) <= 0) {
      return res.status(400).json({ message: "Enter a valid parcel weight" });
    }

    const staffResult = await pool.query(`SELECT id, role, branch_id FROM users WHERE id = $1`, [req.user.id]);
    if (staffResult.rows.length === 0) return res.status(404).json({ message: "Staff account not found" });
    const staff = staffResult.rows[0];
    if (staff.role !== "staff" || !staff.branch_id) return res.status(400).json({ message: "Staff member is not assigned to a branch" });

    async function findOrCreateCustomer(name, phone, existingId = null) {
      if (existingId) {
        const byId = await pool.query("SELECT id, name, phone, role FROM users WHERE id = $1", [Number(existingId)]);
        if (!byId.rows.length || byId.rows[0].role !== "customer") throw new Error("Selected sender is not a valid customer");
        return byId.rows[0];
      }
      const cleanName = String(name || "").trim();
      const cleanPhone = String(phone || "").trim();
      const found = await pool.query("SELECT id, name, phone, role FROM users WHERE phone = $1", [cleanPhone]);
      if (found.rows.length) {
        if (found.rows[0].role !== "customer") throw new Error("This phone number belongs to a staff or administrator account");
        const updated = await pool.query("UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, phone, role", [cleanName, found.rows[0].id]);
        return updated.rows[0];
      }
      const created = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, role, branch_id) VALUES ($1, NULL, $2, NULL, 'customer', $3) RETURNING id, name, phone, role`,
        [cleanName, cleanPhone, staff.branch_id || null]
      );
      return created.rows[0];
    }

    let sender, recipient;
    try {
      sender = await findOrCreateCustomer(sender_name, sender_phone, sender_id);
      recipient = await findOrCreateCustomer(recipient_name, recipient_phone);
    } catch (contactError) {
      return res.status(409).json({ message: contactError.message || "Unable to save sender or recipient" });
    }

    const destinationResult = await pool.query(`SELECT id, name FROM branches WHERE name = $1 AND status = 'Active'`, [destination_branch]);
    if (destinationResult.rows.length === 0) return res.status(400).json({ message: "Please select a valid destination branch" });

    if (!normalizedItems.length || normalizedItems.some((item) =>
      !Number.isInteger(item.parcel_type_id) || item.parcel_type_id <= 0 ||
      !Number.isInteger(item.quantity) || item.quantity < 1
    )) {
      return res.status(400).json({ message: "Each parcel item needs a valid item type and quantity of at least 1" });
    }

    let deliveryFee = 0;
    const pricedItems = [];
    for (const item of normalizedItems) {
      const typeResult = await pool.query(`SELECT id, name FROM parcel_types WHERE id = $1 AND status = 'Active'`, [item.parcel_type_id]);
      if (!typeResult.rows.length) return res.status(400).json({ message: "One of the selected parcel item types is invalid" });
      const priceResult = await pool.query(`SELECT price FROM parcel_branch_prices WHERE parcel_type_id = $1 AND branch_id = $2`, [item.parcel_type_id, destinationResult.rows[0].id]);
      if (!priceResult.rows.length) return res.status(400).json({ message: `No delivery tariff configured for ${typeResult.rows[0].name} to ${destinationResult.rows[0].name}` });
      const unitDeliveryFee = Number(priceResult.rows[0].price);
      deliveryFee += unitDeliveryFee * item.quantity;
      pricedItems.push({ ...item, name: typeResult.rows[0].name, unit_delivery_fee: unitDeliveryFee });
    }

    let trackingNumber;
    const client = await pool.connect();
    let parcel;
    try {
      await client.query("BEGIN");
      const destination = destinationResult.rows[0];
      const defaultBranchPrefixes = { Nairobi: "NAI", Mombasa: "MOM", Kajiado: "KAJ", Voi: "VOI", Kisumu: "KIS" };
      const configuredSequence = await client.query("SELECT prefix FROM tracking_sequences WHERE branch_id = $1", [destination.id]);
      const prefix = configuredSequence.rows[0]?.prefix || defaultBranchPrefixes[destination.name];
      if (!prefix) throw new Error(`No tracking-number prefix configured for branch: ${destination.name}. Configure it in Admin > Branch Management.`);

      const sequenceResult = await client.query(
        `INSERT INTO tracking_sequences (branch_id, prefix, last_number) VALUES ($1, $2, 1)
         ON CONFLICT (branch_id) DO UPDATE SET last_number = tracking_sequences.last_number + 1
         RETURNING last_number`,
        [destination.id, prefix]
      );
      const sequenceNumber = Number(sequenceResult.rows[0].last_number);
      trackingNumber = `${prefix}-${String(sequenceNumber).padStart(6, "0")}`;

      const result = await client.query(
        `INSERT INTO parcels (
          tracking_number, sender_id, recipient_id, recipient_name, recipient_phone,
          origin_branch, destination_branch, parcel_description, weight, delivery_fee,
          status, branch_id, parcel_type_id, registered_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [
          trackingNumber, sender.id, recipient.id, String(recipient_name).trim(), String(recipient_phone).trim(),
          staff.branch_id.toString(), destinationResult.rows[0].name,
          pricedItems.map((item) => `${item.name} x ${item.quantity}${item.description ? ` (${item.description})` : ""}`).join(", "),
          Number(weight), deliveryFee, "Received", staff.branch_id, pricedItems[0].parcel_type_id, staff.id,
        ]
      );
      parcel = result.rows[0];

      for (const item of pricedItems) {
        await client.query(
          `INSERT INTO parcel_items (parcel_id, parcel_type_id, quantity, description, unit_delivery_fee, line_delivery_fee)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [parcel.id, item.parcel_type_id, item.quantity, item.description || null, item.unit_delivery_fee, item.unit_delivery_fee * item.quantity]
        );
      }

      await client.query(
        `INSERT INTO parcel_status_history (parcel_id, status, location, updated_by) VALUES ($1, $2, $3, $4)`,
        [parcel.id, "Received", staff.branch_id.toString(), staff.id]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }

    function normalizeKenyanPhone(phone) {
      const digits = String(phone || "").replace(/\D/g, "");
      if (digits.startsWith("254")) return "+" + digits;
      if (digits.startsWith("0") && digits.length === 10) return "+254" + digits.slice(1);
      if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) return "+254" + digits;
      return null;
    }

    const senderPhone = normalizeKenyanPhone(sender.phone);
    const receiverPhone = normalizeKenyanPhone(recipient_phone);
    const smsJobs = [];

    if (senderPhone) {
      smsJobs.push({ phone: senderPhone, message: `Hello ${sender.name}, your parcel has been registered. Tracking number: ${trackingNumber}. Destination: ${destinationResult.rows[0].name}.` });
    }
    if (receiverPhone && receiverPhone !== senderPhone) {
      smsJobs.push({ phone: receiverPhone, message: `Hello ${recipient_name}, a parcel has been registered for you. Tracking number: ${trackingNumber}. Destination: ${destinationResult.rows[0].name}.` });
    }

    const smsResults = await Promise.allSettled(smsJobs.map((job) => sendSMS(job.phone, job.message)));

    smsResults.forEach((result, index) => {
      if (result.status === "rejected" || !result.value?.success) {
        console.error(`SMS notification failed for ${smsJobs[index].phone}:`, result.status === "rejected" ? result.reason : result.value?.message);
      }
    });

    return res.status(201).json({
      message: "Parcel registered successfully",
      parcel,
      smsNotifications: smsResults.map((result, index) => ({ recipient: smsJobs[index].phone, success: result.status === "fulfilled" && result.value?.success === true })),
    });
  } catch (error) {
    console.error("Parcel creation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   PUBLIC PARCEL TRACKING
========================================= */

app.get("/api/parcels/track/:trackingNumber", async (req, res) => {
  try {
    const trackingNumber = String(req.params.trackingNumber || "").trim();
    const suppliedName = String(req.query.name || "").trim();
    if (!suppliedName) return res.status(400).json({ message: "Enter the sender or recipient name to track this parcel" });
    const result = await pool.query(
      `SELECT p.id, p.tracking_number,
        COALESCE(origin.name, p.origin_branch) AS origin_branch,
        COALESCE(destination.name, p.destination_branch) AS destination_branch,
        p.status, p.created_at, p.recipient_name, sender.name AS sender_name
       FROM parcels p
       LEFT JOIN users sender ON sender.id = p.sender_id
       LEFT JOIN branches origin ON origin.id = p.branch_id
       LEFT JOIN branches destination ON LOWER(destination.name) = LOWER(p.destination_branch)
       WHERE p.tracking_number = $1
         AND (LOWER(TRIM(sender.name)) = LOWER($2) OR LOWER(TRIM(p.recipient_name)) = LOWER($2))`,
      [trackingNumber, suppliedName]
    );
    if (!result.rows.length) return res.status(404).json({ message: "No parcel matched that tracking number and name" });
    const parcel = result.rows[0];
    const history = await pool.query(
      `SELECT h.status, COALESCE(b.name, h.location) AS location, h.timestamp
       FROM parcel_status_history h LEFT JOIN branches b ON b.id::text = h.location
       WHERE h.parcel_id = $1 ORDER BY h.timestamp ASC`,
      [parcel.id]
    );
    return res.status(200).json({
      message: "Parcel found",
      parcel: {
        tracking_number: parcel.tracking_number,
        origin_branch: parcel.origin_branch,
        destination_branch: parcel.destination_branch,
        status: parcel.status,
        created_at: parcel.created_at,
        tracking_history: history.rows,
      },
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return res.status(500).json({ message: "Unable to track parcel" });
  }
});

/* =========================================
   STAFF PARCEL SUMMARY
========================================= */

app.get("/api/staff/parcel-summary", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") return res.status(403).json({ message: "Only staff members can access the parcel summary" });
    const branchId = req.user.branch_id;
    if (!branchId) return res.status(400).json({ message: "Staff member is not assigned to a branch" });
    const result = await pool.query(
      `SELECT COUNT(*) AS total_parcels,
        COUNT(*) FILTER (WHERE status = 'Received') AS received,
        COUNT(*) FILTER (WHERE status = 'Dispatched') AS dispatched,
        COUNT(*) FILTER (WHERE status = 'In Transit') AS in_transit,
        COUNT(*) FILTER (WHERE status = 'Arrived') AS arrived,
        COUNT(*) FILTER (WHERE status = 'Out for Delivery') AS out_for_delivery,
        COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered
       FROM parcels WHERE branch_id = $1`,
      [branchId]
    );
    res.status(200).json({ summary: result.rows[0] });
  } catch (error) {
    console.error("Staff parcel summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   GET STAFF PARCELS — UPDATED WITH total_paid
========================================= */

app.get("/api/staff/parcels", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") return res.status(403).json({ message: "Only staff members can access parcels" });
    const branchId = req.user.branch_id;
    if (!branchId) return res.status(400).json({ message: "Staff member is not assigned to a branch" });
    const result = await pool.query(
      `SELECT p.id, p.tracking_number, p.recipient_name, p.recipient_phone,
        COALESCE(origin.name, p.origin_branch) AS origin_branch,
        COALESCE(destination.name, p.destination_branch) AS destination_branch,
        p.parcel_description, p.weight, p.delivery_fee, p.status, p.created_at,
        pt.name AS parcel_type, u.name AS customer_name, u.phone AS customer_phone,
        COALESCE(pay.total_paid, 0)::numeric AS total_paid
       FROM parcels p
       LEFT JOIN branches origin ON origin.id = p.branch_id
       LEFT JOIN branches destination ON LOWER(destination.name) = LOWER(p.destination_branch)
       LEFT JOIN parcel_types pt ON pt.id = p.parcel_type_id
       LEFT JOIN users u ON u.id = p.sender_id
       LEFT JOIN (
         SELECT parcel_id, SUM(amount) AS total_paid FROM payments
         WHERE LOWER(status) IN ('success','successful','completed','paid') GROUP BY parcel_id
       ) pay ON pay.parcel_id = p.id
       WHERE p.branch_id = $1 ORDER BY p.created_at DESC`,
      [branchId]
    );
    res.status(200).json({ parcels: result.rows });
  } catch (error) {
    console.error("Staff parcels retrieval error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   ADMIN DASHBOARD SUMMARY
========================================= */

app.get("/api/admin/customers", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
    const result = await pool.query(`SELECT id, name, email, phone, branch_id, created_at FROM users WHERE role = 'customer' ORDER BY name ASC`);
    return res.json({ customers: result.rows });
  } catch (error) {
    console.error("Admin customers error:", error);
    return res.status(500).json({ message: "Unable to load customers" });
  }
});

app.get("/api/admin/customers/:id/parcels", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid customer ID" });
    const result = await pool.query(
      `SELECT p.id, p.tracking_number, p.status, p.created_at,
        COALESCE(o.name,p.origin_branch) AS origin_branch,
        COALESCE(d.name,p.destination_branch) AS destination_branch,
        CASE WHEN p.sender_id = $1 THEN 'Sender' ELSE 'Recipient' END AS customer_role
       FROM parcels p
       LEFT JOIN branches o ON o.id=p.branch_id
       LEFT JOIN branches d ON LOWER(d.name)=LOWER(p.destination_branch)
       WHERE p.sender_id=$1 OR p.recipient_id=$1 ORDER BY p.created_at DESC`,
      [id]
    );
    return res.json({ parcels: result.rows });
  } catch (error) {
    console.error("Customer parcel history error:", error);
    return res.status(500).json({ message: "Unable to load parcel history" });
  }
});

app.get("/api/admin/summary", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Only administrators can access system statistics" });

    const [parcelCounts, userCounts, branchCounts, statusCounts, branchSummary] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total_parcels, COUNT(*) FILTER (WHERE status = 'Delivered')::int AS delivered, COUNT(*) FILTER (WHERE status <> 'Delivered')::int AS active_parcels FROM parcels`),
      pool.query(`SELECT COUNT(*) FILTER (WHERE role = 'customer')::int AS total_customers, COUNT(*) FILTER (WHERE role = 'staff')::int AS total_staff FROM users`),
      pool.query(`SELECT COUNT(*)::int AS total_branches FROM branches`),
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'Received')::int AS received,
        COUNT(*) FILTER (WHERE status = 'Dispatched')::int AS dispatched,
        COUNT(*) FILTER (WHERE status = 'In Transit')::int AS in_transit,
        COUNT(*) FILTER (WHERE status = 'Arrived')::int AS arrived,
        COUNT(*) FILTER (WHERE status = 'Out for Delivery')::int AS out_for_delivery,
        COUNT(*) FILTER (WHERE status = 'Delivered')::int AS delivered
       FROM parcels`),
      pool.query(`SELECT b.id, b.name, COUNT(p.id)::int AS total_parcels, COUNT(p.id) FILTER (WHERE p.status = 'Delivered')::int AS delivered
       FROM branches b LEFT JOIN parcels p ON p.branch_id = b.id GROUP BY b.id, b.name ORDER BY b.name ASC`),
    ]);

    res.status(200).json({
      summary: { ...parcelCounts.rows[0], ...userCounts.rows[0], ...branchCounts.rows[0] },
      statuses: statusCounts.rows[0],
      branches: branchSummary.rows,
    });
  } catch (error) {
    console.error("Admin dashboard summary error:", error);
    res.status(500).json({ message: "Unable to load admin dashboard statistics" });
  }
});

/* =========================================
   ADMIN PARCEL MANAGEMENT API
========================================= */

app.get("/api/admin/parcels", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Only administrators can access all parcels" });

    const { branchId, fromDate, toDate, status, paymentStatus, search } = req.query;
    const allowedStatuses = ["Received", "Dispatched", "In Transit", "Arrived", "Out for Delivery", "Delivered"];
    const allowedPaymentStatuses = ["Paid", "Unpaid", "Partially Paid"];

    if (status && !allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid parcel status" });
    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) return res.status(400).json({ message: "Invalid payment status" });
    if (branchId && !/^\d+$/.test(branchId)) return res.status(400).json({ message: "Invalid branch" });
    if (fromDate && !/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) return res.status(400).json({ message: "Invalid start date" });
    if (toDate && !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) return res.status(400).json({ message: "Invalid end date" });
    if (fromDate && toDate && fromDate > toDate) return res.status(400).json({ message: "Start date cannot be after end date" });

    const values = [];
    const conditions = [];
    function addCondition(sql, value) {
      values.push(value);
      conditions.push(sql.replace("?", `$${values.length}`));
    }

    if (branchId) addCondition("destination.id = ?", Number(branchId));
    if (fromDate) addCondition("p.created_at >= ?::date", fromDate);
    if (toDate) addCondition("p.created_at < (?::date + INTERVAL '1 day')", toDate);
    if (status) addCondition("p.status = ?", status);
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const n = values.length;
      conditions.push(`(
        p.tracking_number ILIKE $${n} OR p.recipient_name ILIKE $${n} OR p.recipient_phone ILIKE $${n}
        OR sender.name ILIKE $${n} OR sender.phone ILIKE $${n}
      )`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [branchesResult, parcelsResult] = await Promise.all([
      pool.query(`SELECT id, name FROM branches ORDER BY name ASC`),
      pool.query(
        `SELECT p.id, p.tracking_number, p.sender_id, p.recipient_name, p.recipient_phone,
          COALESCE(origin.name, p.origin_branch) AS origin_branch,
          COALESCE(destination.name, p.destination_branch) AS destination_branch,
          p.parcel_description, p.weight, p.delivery_fee, p.status, p.created_at,
          sender.name AS sender_name, sender.phone AS sender_phone,
          COALESCE(pay.total_paid, 0)::numeric AS amount_paid,
          GREATEST(COALESCE(p.delivery_fee, 0) - COALESCE(pay.total_paid, 0), 0)::numeric AS outstanding_balance,
          CASE
            WHEN COALESCE(pay.total_paid, 0) <= 0 THEN 'Unpaid'
            WHEN COALESCE(pay.total_paid, 0) >= COALESCE(p.delivery_fee, 0) THEN 'Paid'
            ELSE 'Partially Paid'
          END AS payment_status
        FROM parcels p
        LEFT JOIN branches origin ON origin.id = p.branch_id
        LEFT JOIN branches destination ON LOWER(destination.name) = LOWER(p.destination_branch)
        LEFT JOIN users sender ON sender.id = p.sender_id
        LEFT JOIN (
          SELECT parcel_id, SUM(amount) AS total_paid FROM payments
          WHERE LOWER(status) IN ('success','successful','completed','paid') GROUP BY parcel_id
        ) pay ON pay.parcel_id = p.id
        ${whereClause}
        ORDER BY p.created_at DESC NULLS LAST`,
        values
      ),
    ]);

    let parcels = parcelsResult.rows;
    if (paymentStatus) parcels = parcels.filter((parcel) => parcel.payment_status === paymentStatus);

    const totals = parcels.reduce(
      (acc, parcel) => {
        acc.totalFees += Number(parcel.delivery_fee || 0);
        acc.totalPaid += Number(parcel.amount_paid || 0);
        acc.outstandingBalance += Number(parcel.outstanding_balance || 0);
        return acc;
      },
      { totalFees: 0, totalPaid: 0, outstandingBalance: 0 }
    );

    return res.status(200).json({ branches: branchesResult.rows, parcels, count: parcels.length, totals });
  } catch (error) {
    console.error("Admin parcels error:", error);
    return res.status(500).json({ message: "Unable to load admin parcel records" });
  }
});

/* =========================================
   ADMIN: DELETE A PARCEL
========================================= */

app.delete("/api/admin/parcels/:id", authMiddleware, async (req, res) => {
  const parcelId = Number(req.params.id);
  if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
  if (!Number.isInteger(parcelId) || parcelId <= 0) return res.status(400).json({ message: "Invalid parcel ID" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const parcelResult = await client.query("SELECT id, tracking_number FROM parcels WHERE id = $1 FOR UPDATE", [parcelId]);
    if (parcelResult.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Parcel not found" }); }

    const paymentResult = await client.query("SELECT COUNT(*)::int AS count FROM payments WHERE parcel_id = $1", [parcelId]);
    if (paymentResult.rows[0].count > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This parcel has payment records and cannot be deleted. Keep it for financial records." });
    }

    await client.query("DELETE FROM parcel_status_history WHERE parcel_id = $1", [parcelId]);
    await client.query("DELETE FROM parcels WHERE id = $1", [parcelId]);
    await client.query("COMMIT");

    return res.status(200).json({ message: "Parcel deleted successfully", tracking_number: parcelResult.rows[0].tracking_number });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin parcel deletion error:", error);
    return res.status(500).json({ message: "Unable to delete parcel" });
  } finally { client.release(); }
});

/* =========================================
   ADMIN: MANAGE PARCEL ITEMS AND PRICES
========================================= */

app.get("/api/admin/pricing", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });

    const result = await pool.query(`
      SELECT pt.id AS parcel_type_id, pt.name AS parcel_type, pt.description, pt.status AS parcel_type_status,
        b.id AS branch_id, b.name AS branch_name, pbp.price
      FROM parcel_types pt
      CROSS JOIN branches b
      LEFT JOIN parcel_branch_prices pbp ON pbp.parcel_type_id = pt.id AND pbp.branch_id = b.id
      ORDER BY pt.name, b.name
    `);
    const branchesResult = await pool.query(`SELECT id, name FROM branches WHERE status = 'Active' ORDER BY name`);
    const typesResult = await pool.query(`SELECT id, name, description, status FROM parcel_types ORDER BY name`);

    return res.status(200).json({ items: typesResult.rows, branches: branchesResult.rows, prices: result.rows });
  } catch (error) {
    console.error("Admin pricing retrieval error:", error);
    return res.status(500).json({ message: "Unable to load pricing" });
  }
});

app.post("/api/admin/parcel-types", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Item name is required" });
    const result = await pool.query(
      `INSERT INTO parcel_types (name, description, status) VALUES ($1, $2, 'Active') RETURNING id, name, description, status`,
      [name.trim(), description?.trim() || null]
    );
    return res.status(201).json({ message: "Parcel item added successfully", item: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ message: "An item with this name may already exist" });
    console.error("Add parcel item error:", error);
    return res.status(500).json({ message: "Unable to add parcel item" });
  }
});

app.put("/api/admin/pricing", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") return res.status(403).json({ message: "Admin access required" });
    const { parcel_type_id, branch_id, price } = req.body;
    if (!Number.isInteger(Number(parcel_type_id)) || Number(parcel_type_id) <= 0 ||
        !Number.isInteger(Number(branch_id)) || Number(branch_id) <= 0 ||
        price === undefined || price === null || price === "" ||
        !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Valid item, destination branch, and price are required" });
    }

    const typeCheck = await pool.query(`SELECT id FROM parcel_types WHERE id = $1 AND status = 'Active'`, [Number(parcel_type_id)]);
    const branchCheck = await pool.query(`SELECT id FROM branches WHERE id = $1 AND status = 'Active'`, [Number(branch_id)]);
    if (!typeCheck.rows.length || !branchCheck.rows.length) return res.status(400).json({ message: "Select an active parcel item and destination branch" });

    const result = await pool.query(
      `INSERT INTO parcel_branch_prices (parcel_type_id, branch_id, price, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (parcel_type_id, branch_id) DO UPDATE SET price = EXCLUDED.price, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [Number(parcel_type_id), Number(branch_id), Number(price)]
    );
    return res.status(200).json({ message: "Price saved successfully", price: result.rows[0] });
  } catch (error) {
    console.error("Save parcel price error:", error);
    return res.status(500).json({ message: "Unable to save parcel price" });
  }
});

/* =========================================
   CUSTOMER PARCEL SUMMARY
========================================= */

app.get("/api/customer/parcel-summary", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can access their parcel summary" });
    const result = await pool.query(
      `SELECT COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status IN ('In Transit', 'Out for Delivery')) AS in_transit,
        COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered,
        COUNT(*) FILTER (WHERE status IN ('Received', 'Dispatched', 'Arrived')) AS pending
       FROM parcels WHERE sender_id = $1`,
      [req.user.id]
    );
    const row = result.rows[0];
    res.status(200).json({
      summary: { total: Number(row.total), inTransit: Number(row.in_transit), delivered: Number(row.delivered), pending: Number(row.pending) },
    });
  } catch (error) {
    console.error("Customer parcel summary error:", error);
    res.status(500).json({ message: "Unable to retrieve parcel summary" });
  }
});

/* =========================================
   GET CUSTOMER PARCELS — WITH total_paid
========================================= */

app.get("/api/my-parcels", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can access their parcels" });
    const result = await pool.query(
      `SELECT p.id, p.tracking_number, p.recipient_name, p.recipient_phone,
        COALESCE(origin.name, p.origin_branch) AS origin_branch,
        COALESCE(destination.name, p.destination_branch) AS destination_branch,
        p.parcel_description, p.weight, p.delivery_fee, p.status, p.created_at,
        pt.name AS parcel_type,
        COALESCE(pay.total_paid, 0)::numeric AS total_paid
       FROM parcels p
       LEFT JOIN branches origin ON origin.id = p.branch_id
       LEFT JOIN branches destination ON LOWER(destination.name) = LOWER(p.destination_branch)
       LEFT JOIN parcel_types pt ON pt.id = p.parcel_type_id
       LEFT JOIN (
         SELECT parcel_id, SUM(amount) AS total_paid FROM payments
         WHERE LOWER(status) IN ('success','successful','completed','paid') GROUP BY parcel_id
       ) pay ON pay.parcel_id = p.id
       WHERE p.sender_id = $1 ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ parcels: result.rows });
  } catch (error) {
    console.error("Customer parcels retrieval error:", error);
    res.status(500).json({ message: "Unable to retrieve your parcels" });
  }
});

/* =========================================
   M-PESA STK PUSH PAYMENT — ALLOWS BOTH CUSTOMER & STAFF
========================================= */

app.post("/api/payments/stk-push", authMiddleware, async (req, res) => {
  let paymentId = null;
  try {
       // It must say exactly this:
    if (!["customer", "staff"].includes(String(req.user.role).toLowerCase())) {
      return res.status(403).json({ message: "Only customers and staff can initiate parcel payments." });
    }

    const { trackingNumber, phoneNumber, amount } = req.body;

    if (!trackingNumber || !phoneNumber || amount === undefined || amount === null || amount === "") {
      return res.status(400).json({ message: "Tracking number, phone number and amount are required." });
    }

    let phone = String(phoneNumber).replace(/[\s+-]/g, "");
    if (phone.startsWith("0")) phone = "254" + phone.slice(1);
    else if (phone.startsWith("7") || phone.startsWith("1")) phone = "254" + phone;
    if (!/^254[17]\d{8}$/.test(phone)) return res.status(400).json({ message: "Enter a valid Kenyan mobile number." });

    let parcelQuery;
    let parcelParams;

    if (req.user.role === "customer") {
      parcelQuery = `SELECT id, tracking_number, sender_id, delivery_fee, status FROM parcels WHERE tracking_number = $1 AND sender_id = $2`;
      parcelParams = [String(trackingNumber).trim(), req.user.id];
    } else {
      // Staff can search across all parcels at their branch
      parcelQuery = `SELECT id, tracking_number, sender_id, delivery_fee, status FROM parcels WHERE tracking_number = $1 AND branch_id = $2`;
      parcelParams = [String(trackingNumber).trim(), req.user.branch_id];
    }

    const parcelResult = await pool.query(parcelQuery, parcelParams);
    if (parcelResult.rows.length === 0) return res.status(404).json({ message: "Parcel not found in your account." });

    const parcel = parcelResult.rows[0];
    const paymentAmount = Math.round(Number(amount));

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid payment amount." });
    }

    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments
       WHERE parcel_id = $1 AND LOWER(status) IN ('paid','success','successful','completed')`,
      [parcel.id]
    );
    const alreadyPaid = Number(paidResult.rows[0].total_paid);
    const outstanding = Number(parcel.delivery_fee) - alreadyPaid;

    if (outstanding <= 0) return res.status(409).json({ message: "This parcel is already fully paid." });
    if (paymentAmount > outstanding) return res.status(400).json({ message: `You only owe KES ${outstanding}. You cannot overpay.` });

    const callbackUrl = process.env.DARAJA_CALLBACK_URL;
    if (!callbackUrl) return res.status(503).json({ message: "M-Pesa callback URL is not configured yet. No payment was initiated." });

    const paymentResult = await pool.query(
      `INSERT INTO payments (parcel_id, amount, payment_method, status, paid_at, phone_number, created_at)
       VALUES ($1, $2, $3, $4, NULL, $5, CURRENT_TIMESTAMP) RETURNING id`,
      [parcel.id, paymentAmount, "M-Pesa STK Push", "pending", phone]
    );
    paymentId = paymentResult.rows[0].id;

    const stkResult = await initiateStkPush({ phoneNumber: phone, amount: paymentAmount, trackingNumber: parcel.tracking_number, callbackUrl });

    await pool.query(
      `UPDATE payments SET checkout_request_id = $1, merchant_request_id = $2 WHERE id = $3`,
      [stkResult.CheckoutRequestID, stkResult.MerchantRequestID, paymentId]
    );

    return res.status(200).json({
      message: "STK Push requested. Complete the prompt on your phone.",
      paymentId, trackingNumber: parcel.tracking_number, amount: paymentAmount, checkoutRequestId: stkResult.CheckoutRequestID,
    });
  } catch (error) {
    console.error("STK Push error:", error.message);
    if (paymentId !== null) {
      try {
        await pool.query(`UPDATE payments SET status = 'failed' WHERE id = $1 AND LOWER(status) = 'pending'`, [paymentId]);
      } catch (updateError) { console.error("Could not update payment status:", updateError.message); }
    }
    return res.status(500).json({ message: "Unable to initiate M-Pesa payment. Check the backend terminal." });
  }
});

/* =========================================
   SAFARICOM M-PESA STK CALLBACK
========================================= */

app.post("/api/payments/mpesa/callback", async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback || !callback.CheckoutRequestID) {
      console.error("Invalid M-Pesa callback received.");
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid callback data" });
    }
    const checkoutRequestId = callback.CheckoutRequestID;
    const resultCode = Number(callback.ResultCode);

    const paymentResult = await pool.query(`SELECT id, amount, status FROM payments WHERE checkout_request_id = $1 LIMIT 1`, [checkoutRequestId]);
    if (paymentResult.rows.length === 0) {
      console.error("No payment found for checkout request:", checkoutRequestId);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received" });
    }
    const payment = paymentResult.rows[0];

    if (String(payment.status).toLowerCase() !== "pending") {
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Payment already processed" });
    }

    if (resultCode !== 0) {
      await pool.query(`UPDATE payments SET status = 'failed' WHERE id = $1 AND LOWER(status) = 'pending'`, [payment.id]);
      console.log("M-Pesa payment was not completed for payment ID:", payment.id);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received" });
    }

    const items = callback.CallbackMetadata?.Item || [];
    const getMetadataValue = (name) => items.find((item) => item.Name === name)?.Value;
    const receiptNumber = getMetadataValue("MpesaReceiptNumber");
    const callbackAmount = Number(getMetadataValue("Amount"));
    const callbackPhone = getMetadataValue("PhoneNumber");

    if (!receiptNumber || !Number.isFinite(callbackAmount) || callbackAmount <= 0) {
      console.error("Successful callback is missing payment details:", checkoutRequestId);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received for review" });
    }

    if (Math.round(Number(payment.amount)) !== Math.round(callbackAmount)) {
      console.error("M-Pesa amount mismatch for payment ID:", payment.id);
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received for review" });
    }

    const updateResult = await pool.query(
      `UPDATE payments SET status = 'paid', payment_reference = $1, paid_at = CURRENT_TIMESTAMP, phone_number = COALESCE($2, phone_number)
       WHERE id = $3 AND LOWER(status) = 'pending' RETURNING id`,
      [String(receiptNumber), callbackPhone ? String(callbackPhone) : null, payment.id]
    );

    if (updateResult.rowCount === 1) console.log("M-Pesa payment recorded for payment ID:", payment.id);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received" });
  } catch (error) {
    console.error("M-Pesa callback processing error:", error.message);
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Callback processing failed" });
  }
});

/* =========================================
   ADMIN MODULES: AUDIT, FLEET, BULK SMS, FINANCE
========================================= */

const requireAdmin = (req, res) => {
  if (String(req.user?.role || "").toLowerCase() !== "admin") {
    res.status(403).json({ message: "Admin access required." });
    return false;
  }
  return true;
};

async function writeAudit(req, action, entityType, entityId, details = {}) {
  try {
    await pool.query(
      `INSERT INTO system_audit_logs (actor_user_id, actor_name, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [req.user?.id || null, req.user?.name || null, action, entityType, entityId == null ? null : String(entityId), JSON.stringify(details), req.ip || null]
    );
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
}

app.get("/api/admin/system-logs", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 300);
    const search = String(req.query.search || "").trim().slice(0, 100);
    const result = await pool.query(
      `SELECT id, actor_user_id, actor_name, action, entity_type, entity_id, details, ip_address, created_at
       FROM system_audit_logs
       WHERE ($1 = '' OR action ILIKE '%' || $1 || '%' OR entity_type ILIKE '%' || $1 || '%' OR COALESCE(actor_name,'') ILIKE '%' || $1 || '%')
       ORDER BY created_at DESC LIMIT $2`,
      [search, limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Could not load system logs.", error: err.message });
  }
});

app.get("/api/admin/fleet", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT v.*, u.name AS driver_name, b.name AS branch_name
       FROM fleet_vehicles v
       LEFT JOIN users u ON u.id=v.driver_user_id
       LEFT JOIN branches b ON b.id=v.branch_id
       ORDER BY v.created_at DESC, v.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Could not load fleet.", error: err.message });
  }
});

app.post("/api/admin/fleet", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { registration_number, make_model = "", capacity_kg = null, status = "available", driver_user_id = null, branch_id = null, notes = "" } = req.body || {};
  if (!String(registration_number || "").trim()) return res.status(400).json({ message: "Vehicle registration number is required." });
  if (!["available","on_route","maintenance","inactive"].includes(status)) return res.status(400).json({ message: "Invalid vehicle status." });
  try {
    const result = await pool.query(
      `INSERT INTO fleet_vehicles (registration_number, make_model, capacity_kg, status, driver_user_id, branch_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [String(registration_number).trim().toUpperCase(), make_model, capacity_kg === "" ? null : capacity_kg, status, driver_user_id || null, branch_id || null, notes]
    );
    await writeAudit(req, "fleet_vehicle_created", "fleet_vehicle", result.rows[0].id, { registration_number: result.rows[0].registration_number });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(err.code === "23505" ? 409 : 400).json({
      message: err.code === "23505" ? "That registration number already exists." : "Could not save vehicle.",
      error: err.message,
    });
  }
});

app.put("/api/admin/fleet/:id", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { registration_number, make_model = "", capacity_kg = null, status = "available", driver_user_id = null, branch_id = null, notes = "" } = req.body || {};
  if (!String(registration_number || "").trim()) return res.status(400).json({ message: "Vehicle registration number is required." });
  if (!["available","on_route","maintenance","inactive"].includes(status)) return res.status(400).json({ message: "Invalid vehicle status." });
  try {
    const result = await pool.query(
      `UPDATE fleet_vehicles SET registration_number=$1, make_model=$2, capacity_kg=$3, status=$4, driver_user_id=$5, branch_id=$6, notes=$7, updated_at=CURRENT_TIMESTAMP
       WHERE id=$8 RETURNING *`,
      [String(registration_number).trim().toUpperCase(), make_model, capacity_kg === "" ? null : capacity_kg, status, driver_user_id || null, branch_id || null, notes, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: "Vehicle not found." });
    await writeAudit(req, "fleet_vehicle_updated", "fleet_vehicle", req.params.id, { registration_number: result.rows[0].registration_number, status });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(err.code === "23505" ? 409 : 400).json({ message: "Could not update vehicle.", error: err.message });
  }
});

app.delete("/api/admin/fleet/:id", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await pool.query("DELETE FROM fleet_vehicles WHERE id=$1 RETURNING id, registration_number", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Vehicle not found." });
    await writeAudit(req, "fleet_vehicle_deleted", "fleet_vehicle", req.params.id, { registration_number: result.rows[0].registration_number });
    res.json({ message: "Vehicle deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete vehicle.", error: err.message });
  }
});

app.get("/api/admin/fleet-options", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [staff, branches] = await Promise.all([
      pool.query("SELECT id, name FROM users WHERE LOWER(role)='staff' AND COALESCE(is_active, TRUE)=TRUE ORDER BY name"),
      pool.query("SELECT id, name FROM branches ORDER BY name"),
    ]);
    res.json({ staff: staff.rows, branches: branches.rows });
  } catch (err) {
    res.status(500).json({ message: "Could not load driver/branch options.", error: err.message });
  }
});

app.get("/api/admin/bulk-messages/options", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [branches, statuses] = await Promise.all([
      pool.query("SELECT id, name FROM branches ORDER BY name"),
      pool.query("SELECT DISTINCT status FROM parcels WHERE status IS NOT NULL ORDER BY status"),
    ]);
    res.json({ branches: branches.rows, statuses: statuses.rows.map((r) => r.status) });
  } catch (err) {
    res.status(500).json({ message: "Could not load message audience options.", error: err.message });
  }
});

app.post("/api/admin/bulk-messages/preview", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { audience = "all", branch_id = null, parcel_status = null } = req.body || {};
  try {
    const result = await pool.query(
      `SELECT COUNT(DISTINCT u.id)::int AS recipient_count
       FROM users u
       WHERE LOWER(u.role)='customer' AND COALESCE(u.is_active, TRUE)=TRUE AND NULLIF(TRIM(u.phone),'') IS NOT NULL
       AND ($1='all'
         OR ($1='branch' AND EXISTS (SELECT 1 FROM parcels p WHERE (p.sender_id=u.id OR p.recipient_id=u.id) AND p.branch_id=$2))
         OR ($1='status' AND EXISTS (SELECT 1 FROM parcels p WHERE (p.sender_id=u.id OR p.recipient_id=u.id) AND LOWER(p.status)=LOWER($3))))`,
      [audience, branch_id || null, parcel_status || null]
    );
    res.json({ recipient_count: result.rows[0].recipient_count, max_allowed: 200, message: "Preview only; no SMS has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Could not preview recipients.", error: err.message });
  }
});

app.post("/api/admin/bulk-messages/send", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { message, audience = "all", branch_id = null, parcel_status = null } = req.body || {};
  const cleanMessage = String(message || "").trim();
  if (!cleanMessage) return res.status(400).json({ message: "Enter a message." });
  if (cleanMessage.length > 480) return res.status(400).json({ message: "Message must be 480 characters or fewer." });
  if (!["all", "branch", "status"].includes(audience)) return res.status(400).json({ message: "Invalid audience." });
  if (audience === "branch" && !branch_id) return res.status(400).json({ message: "Choose a branch." });
  if (audience === "status" && !parcel_status) return res.status(400).json({ message: "Choose a parcel status." });

  let campaignId = null;
  try {
    const recipients = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.phone
       FROM users u WHERE LOWER(u.role)='customer' AND COALESCE(u.is_active, TRUE)=TRUE AND NULLIF(TRIM(u.phone),'') IS NOT NULL
       AND ($1='all'
         OR ($1='branch' AND EXISTS (SELECT 1 FROM parcels p WHERE (p.sender_id=u.id OR p.recipient_id=u.id) AND p.branch_id=$2))
         OR ($1='status' AND EXISTS (SELECT 1 FROM parcels p WHERE (p.sender_id=u.id OR p.recipient_id=u.id) AND LOWER(p.status)=LOWER($3))))
       ORDER BY u.id LIMIT 201`,
      [audience, branch_id || null, parcel_status || null]
    );
    if (recipients.rows.length > 200) return res.status(413).json({ message: "This audience exceeds the 200-recipient safety limit. Narrow the audience first." });
    if (!recipients.rows.length) return res.status(400).json({ message: "No customers with phone numbers match this audience." });

    const campaign = await pool.query(
      `INSERT INTO bulk_message_campaigns (created_by, message, audience_type, branch_id, parcel_status, recipient_count, status)
       VALUES ($1,$2,$3,$4,$5,$6,'sending') RETURNING id`,
      [req.user.id, cleanMessage, audience, branch_id || null, parcel_status || null, recipients.rows.length]
    );
    campaignId = campaign.rows[0].id;

    let sent = 0;
    let failed = 0;
    for (const recipient of recipients.rows) {
      let ok = false;
      let errorMessage = null;
      try {
        const result = await sendSMS(recipient.phone, cleanMessage);
        ok = Boolean(result?.success);
        if (!ok) errorMessage = String(result?.message || "SMS provider did not confirm success").slice(0, 500);
      } catch (err) {
        errorMessage = String(err.message || "SMS failed").slice(0, 500);
      }
      await pool.query(
        `INSERT INTO bulk_message_recipients (campaign_id, customer_id, phone, status, error_message) VALUES ($1,$2,$3,$4,$5)`,
        [campaignId, recipient.id, recipient.phone, ok ? "sent" : "failed", errorMessage]
      );
      if (ok) sent++;
      else failed++;
    }

    await pool.query(
      `UPDATE bulk_message_campaigns SET sent_count=$1, failed_count=$2, status=$3, completed_at=CURRENT_TIMESTAMP WHERE id=$4`,
      [sent, failed, failed === 0 ? "completed" : sent === 0 ? "failed" : "partial", campaignId]
    );
    await writeAudit(req, "bulk_sms_sent", "bulk_message_campaign", campaignId, { audience, recipient_count: recipients.rows.length, sent, failed });

    res.json({
      campaign_id: campaignId,
      recipient_count: recipients.rows.length,
      sent,
      failed,
      message: `Bulk SMS finished: ${sent} sent, ${failed} failed.`,
    });
  } catch (err) {
    if (campaignId) {
      await pool.query(`UPDATE bulk_message_campaigns SET status='failed', completed_at=CURRENT_TIMESTAMP WHERE id=$1`, [campaignId]).catch(() => {});
    }
    res.status(500).json({ message: "Bulk SMS could not be completed.", error: err.message });
  }
});

app.get("/api/admin/bulk-messages/history", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT c.id, c.message, c.audience_type, c.branch_id, c.parcel_status, c.recipient_count, c.sent_count, c.failed_count, c.status, c.created_at, c.completed_at, u.name AS created_by_name
       FROM bulk_message_campaigns c
       LEFT JOIN users u ON u.id=c.created_by
       ORDER BY c.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Could not load bulk-message history.", error: err.message });
  }
});

app.get("/api/admin/finances", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.from || "")) ? req.query.from : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.to || "")) ? req.query.to : null;
  try {
    const [fees, payments, expenses, recentPayments, recentExpenses] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(delivery_fee),0)::numeric(14,2) AS total_fees, COUNT(*)::int AS parcel_count
         FROM parcels WHERE ($1::date IS NULL OR created_at >= $1::date) AND ($2::date IS NULL OR created_at < ($2::date + INTERVAL '1 day'))`,
        [from, to]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount) FILTER (WHERE LOWER(status)='paid'),0)::numeric(14,2) AS collected,
         COALESCE(SUM(amount) FILTER (WHERE LOWER(status)='pending'),0)::numeric(14,2) AS pending,
         COALESCE(SUM(amount) FILTER (WHERE LOWER(status)='failed'),0)::numeric(14,2) AS failed,
         COUNT(*) FILTER (WHERE LOWER(status)='paid')::int AS paid_count
         FROM payments WHERE ($1::date IS NULL OR COALESCE(paid_at,created_at) >= $1::date) AND ($2::date IS NULL OR COALESCE(paid_at,created_at) < ($2::date + INTERVAL '1 day'))`,
        [from, to]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount),0)::numeric(14,2) AS total_expenses FROM financial_expenses
         WHERE ($1::date IS NULL OR expense_date >= $1::date) AND ($2::date IS NULL OR expense_date < ($2::date + INTERVAL '1 day'))`,
        [from, to]
      ),
      pool.query(
        `SELECT p.id, p.parcel_id, pa.tracking_number, p.amount, p.payment_method, p.status, p.payment_reference, p.paid_at, p.created_at
         FROM payments p LEFT JOIN parcels pa ON pa.id=p.parcel_id
         WHERE ($1::date IS NULL OR COALESCE(p.paid_at,p.created_at) >= $1::date) AND ($2::date IS NULL OR COALESCE(p.paid_at,p.created_at) < ($2::date + INTERVAL '1 day'))
         ORDER BY p.created_at DESC LIMIT 100`,
        [from, to]
      ),
      pool.query(
        `SELECT id, description, category, amount, expense_date, created_at FROM financial_expenses
         WHERE ($1::date IS NULL OR expense_date >= $1::date) AND ($2::date IS NULL OR expense_date < ($2::date + INTERVAL '1 day'))
         ORDER BY expense_date DESC, id DESC LIMIT 100`,
        [from, to]
      ),
    ]);
    const f = fees.rows[0];
    const p = payments.rows[0];
    const e = expenses.rows[0];
    res.json({
      summary: {
        parcel_fees: Number(f.total_fees),
        parcel_count: f.parcel_count,
        collected: Number(p.collected),
        pending_payments: Number(p.pending),
        failed_payments: Number(p.failed),
        paid_payment_count: p.paid_count,
        expenses: Number(e.total_expenses),
        net_cash: Number(p.collected) - Number(e.total_expenses),
        fee_collection_gap: Number(f.total_fees) - Number(p.collected),
      },
      payments: recentPayments.rows,
      expenses: recentExpenses.rows,
      period: { from, to },
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load financial report.", error: err.message });
  }
});

app.post("/api/admin/finances/expenses", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { description, category = "Other", amount, expense_date } = req.body || {};
  if (!String(description || "").trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(expense_date || ""))) {
    return res.status(400).json({ message: "Provide an expense description, a positive amount and a valid date." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO financial_expenses (description, category, amount, expense_date, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [String(description).trim(), String(category).trim().slice(0, 80), Number(amount), expense_date, req.user.id]
    );
    await writeAudit(req, "financial_expense_created", "financial_expense", result.rows[0].id, { category, amount: Number(amount) });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Could not record expense.", error: err.message });
  }
});

app.get("/api/admin/finances/expenses", authMiddleware, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const result = await pool.query(
      "SELECT id, description, category, amount, expense_date, created_at FROM financial_expenses ORDER BY expense_date DESC, id DESC LIMIT 200"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Could not load expenses.", error: err.message });
  }
});

/* =========================================
   ADMIN: NOTIFICATION LOGS
========================================= */

app.get("/api/admin/notifications", authMiddleware, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const result = await pool.query(`
      SELECT
        p.id,
        p.tracking_number,
        p.recipient_phone AS phone,
        p.recipient_name AS name,
        'Parcel Registered' AS type,
        'Sent' AS status,
        p.created_at AS sent_at
      FROM parcels p
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    return res.status(200).json({ notifications: result.rows });
  } catch (error) {
    console.error("Notification fetch error:", error);
    return res.status(500).json({ message: "Unable to load notifications" });
  }
});

/* =========================================
   START SERVER
========================================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});