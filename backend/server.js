
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
   HOME
========================================= */

app.get("/", (req, res) => {
  res.json({
    message: "Parcel Management and Tracking System API is running!"
  });
});


/* =========================================
   CUSTOMER REGISTRATION
========================================= */

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await pool.query(
      `SELECT id FROM users
       WHERE email = $1 OR phone = $2`,
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email or phone number already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role, branch_id, created_at`,
      [name, email, phone, passwordHash]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   LOGIN
========================================= */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await pool.query(
      `SELECT
        id, name, email, phone, password_hash, role, branch_id
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        branch_id: user.branch_id
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branch_id: user.branch_id
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   GET BRANCHES
   STAFF ONLY
========================================= */

app.get("/api/branches", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can access branches"
      });
    }

    const result = await pool.query(
      `SELECT id, name, location, status
       FROM branches
       WHERE status = 'Active'
       ORDER BY name ASC`
    );

    res.status(200).json({
      branches: result.rows
    });

  } catch (error) {
    console.error("Branch retrieval error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   GET PARCEL TYPES
   STAFF ONLY
========================================= */

app.get("/api/parcel-types", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can access parcel types"
      });
    }

    const result = await pool.query(
      `SELECT id, name, description, status
       FROM parcel_types
       WHERE status = 'Active'
       ORDER BY name ASC`
    );

    res.status(200).json({
      parcelTypes: result.rows
    });

  } catch (error) {
    console.error("Parcel type retrieval error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   GET CUSTOMERS
   STAFF ONLY
========================================= */

app.get("/api/customers", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can access customers"
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, phone, branch_id, created_at
       FROM users
       WHERE role = 'customer'
       ORDER BY name ASC`
    );

    res.status(200).json({
      customers: result.rows
    });

  } catch (error) {
    console.error("Customer retrieval error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   ADD CUSTOMER
   STAFF ONLY
========================================= */

app.post("/api/customers", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can add customers"
      });
    }

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required"
      });
    }

    const existingUser = await pool.query(
      `SELECT id FROM users
       WHERE email = $1 OR phone = $2`,
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "A user with this email or phone already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (name, email, phone, password_hash, role, branch_id)
       VALUES ($1, $2, $3, $4, 'customer', $5)
       RETURNING id, name, email, phone, role, branch_id, created_at`,
      [
        name,
        email,
        phone,
        passwordHash,
        req.user.branch_id
      ]
    );

    res.status(201).json({
      message: "Customer added successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error("Add customer error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});



/* =========================================
   CREATE PARCEL
   STAFF ONLY
   SMS TO SENDER AND RECEIVER
========================================= */

app.post("/api/parcels", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can register parcels"
      });
    }

    const {
      sender_id,
      recipient_name,
      recipient_phone,
      destination_branch,
      parcel_description,
      weight,
      delivery_fee,
      parcel_type_id
    } = req.body;

    if (
      !sender_id ||
      !recipient_name ||
      !recipient_phone ||
      !destination_branch ||
      !parcel_description ||
      weight === undefined ||
      weight === null ||
      weight === "" ||
      delivery_fee === undefined ||
      delivery_fee === null ||
      delivery_fee === ""
    ) {
      return res.status(400).json({
        message: "All parcel fields are required"
      });
    }

    if (
      !Number.isFinite(Number(weight)) ||
      Number(weight) <= 0 ||
      !Number.isFinite(Number(delivery_fee)) ||
      Number(delivery_fee) < 0
    ) {
      return res.status(400).json({
        message: "Enter a valid weight and delivery fee"
      });
    }

    const staffResult = await pool.query(
      `SELECT id, role, branch_id
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (staffResult.rows.length === 0) {
      return res.status(404).json({
        message: "Staff account not found"
      });
    }

    const staff = staffResult.rows[0];

    if (staff.role !== "staff" || !staff.branch_id) {
      return res.status(400).json({
        message: "Staff member is not assigned to a branch"
      });
    }

    // Get the sender's name and phone number.
    const customerResult = await pool.query(
      `SELECT id, name, phone, role
       FROM users
       WHERE id = $1`,
      [sender_id]
    );

    if (
      customerResult.rows.length === 0 ||
      customerResult.rows[0].role !== "customer"
    ) {
      return res.status(400).json({
        message: "A valid customer must be selected"
      });
    }

    const sender = customerResult.rows[0];

    const destinationResult = await pool.query(
      `SELECT id, name
       FROM branches
       WHERE name = $1 AND status = 'Active'`,
      [destination_branch]
    );

    if (destinationResult.rows.length === 0) {
      return res.status(400).json({
        message: "Please select a valid destination branch"
      });
    }

    if (parcel_type_id) {
      const typeResult = await pool.query(
        `SELECT id
         FROM parcel_types
         WHERE id = $1 AND status = 'Active'`,
        [parcel_type_id]
      );

      if (typeResult.rows.length === 0) {
        return res.status(400).json({
          message: "Please select a valid parcel type"
        });
      }
    }

    const trackingNumber =
      "PKG-" + Date.now().toString(36).toUpperCase();

    const client = await pool.connect();
    let parcel;

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO parcels (
          tracking_number,
          sender_id,
          recipient_name,
          recipient_phone,
          origin_branch,
          destination_branch,
          parcel_description,
          weight,
          delivery_fee,
          status,
          branch_id,
          parcel_type_id,
          registered_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          trackingNumber,
          sender_id,
          recipient_name,
          recipient_phone,
          staff.branch_id.toString(),
          destinationResult.rows[0].name,
          parcel_description,
          Number(weight),
          Number(delivery_fee),
          "Received",
          staff.branch_id,
          parcel_type_id || null,
          staff.id
        ]
      );

      parcel = result.rows[0];

      await client.query(
        `INSERT INTO parcel_status_history
         (parcel_id, status, location, updated_by)
         VALUES ($1, $2, $3, $4)`,
        [
          parcel.id,
          "Received",
          staff.branch_id.toString(),
          staff.id
        ]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // Normalize Kenyan numbers to international format.
    function normalizeKenyanPhone(phone) {
      const digits = String(phone || "").replace(/\D/g, "");

      if (digits.startsWith("254")) {
        return "+" + digits;
      }

      if (digits.startsWith("0") && digits.length === 10) {
        return "+254" + digits.slice(1);
      }

      if (digits.startsWith("7") || digits.startsWith("1")) {
        if (digits.length === 9) {
          return "+254" + digits;
        }
      }

      return null;
    }

    // Send an SMS without failing parcel registration if SMS fails.
    const senderPhone = normalizeKenyanPhone(sender.phone);
    const receiverPhone = normalizeKenyanPhone(recipient_phone);

    const smsJobs = [];

    if (senderPhone) {
      smsJobs.push({
        phone: senderPhone,
        message:
          `Hello ${sender.name}, your parcel has been registered. ` +
          `Tracking number: ${trackingNumber}. ` +
          `Destination: ${destinationResult.rows[0].name}.`
      });
    }

    if (receiverPhone && receiverPhone !== senderPhone) {
      smsJobs.push({
        phone: receiverPhone,
        message:
          `Hello ${recipient_name}, a parcel has been registered for you. ` +
          `Tracking number: ${trackingNumber}. ` +
          `Destination: ${destinationResult.rows[0].name}.`
      });
    }

    const smsResults = await Promise.allSettled(
      smsJobs.map(job => sendSMS(job.phone, job.message))
    );

    smsResults.forEach((result, index) => {
      if (
        result.status === "rejected" ||
        !result.value?.success
      ) {
        console.error(
          `SMS notification failed for ${smsJobs[index].phone}:`,
          result.status === "rejected"
            ? result.reason
            : result.value?.message
        );
      }
    });

    return res.status(201).json({
      message: "Parcel registered successfully",
      parcel,
      smsNotifications: smsResults.map((result, index) => ({
        recipient: smsJobs[index].phone,
        success:
          result.status === "fulfilled" &&
          result.value?.success === true
      }))
    });

  } catch (error) {
    console.error("Parcel creation error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
});




/* =========================================
   UPDATE PARCEL STATUS
   STAFF ONLY
   SMS TO SENDER AND RECEIVER
========================================= */

app.put("/api/parcels/:id/status", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can update parcel status"
      });
    }

    const { id } = req.params;
    const { status, location } = req.body;

    const allowedStatuses = [
      "Received",
      "Dispatched",
      "In Transit",
      "Arrived",
      "Out for Delivery",
      "Delivered"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid parcel status"
      });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({
        message: "Location is required"
      });
    }

    const staffResult = await pool.query(
      `SELECT branch_id
       FROM users
       WHERE id = $1 AND role = 'staff'`,
      [req.user.id]
    );

    if (
      staffResult.rows.length === 0 ||
      !staffResult.rows[0].branch_id
    ) {
      return res.status(403).json({
        message: "Staff member is not assigned to a branch"
      });
    }

    const branchId = staffResult.rows[0].branch_id;
    const client = await pool.connect();

    let parcel;

    try {
      await client.query("BEGIN");

      const parcelResult = await client.query(
        `SELECT
           p.id,
           p.tracking_number,
           p.status,
           p.sender_id,
           p.recipient_name,
           p.recipient_phone,
           p.destination_branch,
           u.name AS sender_name,
           u.phone AS sender_phone
         FROM parcels p
         LEFT JOIN users u ON u.id = p.sender_id
         WHERE p.id = $1
         FOR UPDATE OF p`,
        [id]
      );

      if (parcelResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Parcel not found"
        });
      }

      parcel = parcelResult.rows[0];

      if (Number(parcel.sender_id) === Number(req.user.id)) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          message: "Staff cannot update their own customer parcel"
        });
      }

      if (
        parcel.branch_id !== undefined &&
        Number(parcel.branch_id) !== Number(branchId)
      ) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          message: "You can only update parcels registered at your branch"
        });
      }

      // Check the parcel's branch separately for access control.
      const branchCheck = await client.query(
        `SELECT branch_id
         FROM parcels
         WHERE id = $1`,
        [id]
      );

      if (
        !branchCheck.rows.length ||
        Number(branchCheck.rows[0].branch_id) !== Number(branchId)
      ) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          message: "You can only update parcels registered at your branch"
        });
      }

      await client.query(
        `UPDATE parcels
         SET status = $1
         WHERE id = $2`,
        [status, id]
      );

      const history = await client.query(
        `INSERT INTO parcel_status_history
         (parcel_id, status, location, updated_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, status, location.trim(), req.user.id]
      );

      await client.query("COMMIT");

      parcel.status = status;
      parcel.location = location.trim();
      parcel.statusHistory = history.rows[0];

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // Convert Kenyan phone numbers to international format.
    function normalizeKenyanPhone(phone) {
      const digits = String(phone || "").replace(/\D/g, "");

      if (digits.startsWith("254") && digits.length === 12) {
        return "+" + digits;
      }

      if (digits.startsWith("0") && digits.length === 10) {
        return "+254" + digits.slice(1);
      }

      if (
        (digits.startsWith("7") || digits.startsWith("1")) &&
        digits.length === 9
      ) {
        return "+254" + digits;
      }

      return null;
    }

    const senderPhone = normalizeKenyanPhone(parcel.sender_phone);
    const receiverPhone = normalizeKenyanPhone(parcel.recipient_phone);

    const message =
      `Parcel update: ${parcel.tracking_number} is now ${status}. ` +
      `Location: ${location.trim()}.`;

    const recipients = new Set(
      [senderPhone, receiverPhone].filter(Boolean)
    );

    const smsResults = await Promise.allSettled(
      [...recipients].map(phone => sendSMS(phone, message))
    );

    smsResults.forEach((result, index) => {
      if (
        result.status === "rejected" ||
        !result.value?.success
      ) {
        console.error(
          "Status SMS failed:",
          result.status === "rejected"
            ? result.reason
            : result.value?.message
        );
      }
    });

    return res.status(200).json({
      message: "Parcel status updated successfully",
      statusHistory: parcel.statusHistory,
      smsNotifications: smsResults.map((result, index) => ({
        success:
          result.status === "fulfilled" &&
          result.value?.success === true
      }))
    });

  } catch (error) {
    console.error("Status update error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
});



/* =========================================
   PUBLIC PARCEL TRACKING
========================================= */

app.get("/api/parcels/track/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const parcelResult = await pool.query(
      `SELECT
        p.id,
        p.tracking_number,
        p.recipient_name,
        p.recipient_phone,
        COALESCE(origin.name, p.origin_branch) AS origin_branch,
        COALESCE(destination.name, p.destination_branch) AS destination_branch,
        p.parcel_description,
        p.weight,
        p.delivery_fee,
        p.status,
        p.created_at,
        pt.name AS parcel_type
       FROM parcels p
       LEFT JOIN branches origin
         ON origin.id = p.branch_id
       LEFT JOIN branches destination
         ON LOWER(destination.name) = LOWER(p.destination_branch)
       LEFT JOIN parcel_types pt
         ON pt.id = p.parcel_type_id
       WHERE p.tracking_number = $1`,
      [trackingNumber]
    );

    if (parcelResult.rows.length === 0) {
      return res.status(404).json({
        message: "Parcel not found"
      });
    }

    const parcel = parcelResult.rows[0];

    const historyResult = await pool.query(
      `SELECT
        h.status,
        COALESCE(b.name, h.location) AS location,
        h.timestamp
       FROM parcel_status_history h
       LEFT JOIN branches b
         ON b.id::text = h.location
       WHERE h.parcel_id = $1
       ORDER BY h.timestamp ASC`,
      [parcel.id]
    );

    res.status(200).json({
      message: "Parcel found",
      parcel: {
        ...parcel,
        tracking_history: historyResult.rows
      }
    });

  } catch (error) {
    console.error("Tracking error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   STAFF PARCEL SUMMARY
========================================= */

app.get("/api/staff/parcel-summary", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can access the parcel summary"
      });
    }

    const branchId = req.user.branch_id;

    if (!branchId) {
      return res.status(400).json({
        message: "Staff member is not assigned to a branch"
      });
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) AS total_parcels,
        COUNT(*) FILTER (WHERE status = 'Received') AS received,
        COUNT(*) FILTER (WHERE status = 'Dispatched') AS dispatched,
        COUNT(*) FILTER (WHERE status = 'In Transit') AS in_transit,
        COUNT(*) FILTER (WHERE status = 'Arrived') AS arrived,
        COUNT(*) FILTER (WHERE status = 'Out for Delivery') AS out_for_delivery,
        COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered
       FROM parcels
       WHERE branch_id = $1`,
      [branchId]
    );

    res.status(200).json({
      summary: result.rows[0]
    });

  } catch (error) {
    console.error("Staff parcel summary error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   GET STAFF PARCELS
========================================= */

app.get("/api/staff/parcels", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Only staff members can access parcels"
      });
    }

    const branchId = req.user.branch_id;

    if (!branchId) {
      return res.status(400).json({
        message: "Staff member is not assigned to a branch"
      });
    }

    const result = await pool.query(
      `SELECT
        p.id,
        p.tracking_number,
        p.recipient_name,
        p.recipient_phone,
        COALESCE(origin.name, p.origin_branch) AS origin_branch,
        COALESCE(destination.name, p.destination_branch) AS destination_branch,
        p.parcel_description,
        p.weight,
        p.delivery_fee,
        p.status,
        p.created_at,
        pt.name AS parcel_type,
        u.name AS customer_name,
        u.phone AS customer_phone
       FROM parcels p
       LEFT JOIN branches origin
         ON origin.id = p.branch_id
       LEFT JOIN branches destination
         ON LOWER(destination.name) = LOWER(p.destination_branch)
       LEFT JOIN parcel_types pt
         ON pt.id = p.parcel_type_id
       LEFT JOIN users u
         ON u.id = p.sender_id
       WHERE p.branch_id = $1
       ORDER BY p.created_at DESC`,
      [branchId]
    );

    res.status(200).json({
      parcels: result.rows
    });

  } catch (error) {
    console.error("Staff parcels retrieval error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
});


/* =========================================
   START SERVER
========================================= */

/* =========================================
   CUSTOMER PARCEL SUMMARY
   CUSTOMER ONLY
========================================= */

app.get("/api/customer/parcel-summary", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can access their parcel summary",
      });
    }

    const result = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (
           WHERE status IN ('In Transit', 'Out for Delivery')
         ) AS in_transit,
         COUNT(*) FILTER (
           WHERE status = 'Delivered'
         ) AS delivered,
         COUNT(*) FILTER (
           WHERE status IN ('Received', 'Dispatched', 'Arrived')
         ) AS pending
       FROM parcels
       WHERE sender_id = $1`,
      [req.user.id]
    );

    const row = result.rows[0];

    res.status(200).json({
      summary: {
        total: Number(row.total),
        inTransit: Number(row.in_transit),
        delivered: Number(row.delivered),
        pending: Number(row.pending),
      },
    });
  } catch (error) {
    console.error("Customer parcel summary error:", error);

    res.status(500).json({
      message: "Unable to retrieve parcel summary",
    });
  }
});


/* =========================================
   GET CUSTOMER PARCELS
   CUSTOMER ONLY
========================================= */

app.get("/api/my-parcels", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can access their parcels",
      });
    }

    const result = await pool.query(
      `SELECT
         p.id,
         p.tracking_number,
         p.recipient_name,
         p.recipient_phone,
         COALESCE(origin.name, p.origin_branch) AS origin_branch,
         COALESCE(destination.name, p.destination_branch) AS destination_branch,
         p.parcel_description,
         p.weight,
         p.delivery_fee,
         p.status,
         p.created_at,
         pt.name AS parcel_type
       FROM parcels p
       LEFT JOIN branches origin
         ON origin.id = p.branch_id
       LEFT JOIN branches destination
         ON LOWER(destination.name) = LOWER(p.destination_branch)
       LEFT JOIN parcel_types pt
         ON pt.id = p.parcel_type_id
       WHERE p.sender_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      parcels: result.rows,
    });
  } catch (error) {
    console.error("Customer parcels retrieval error:", error);

    res.status(500).json({
      message: "Unable to retrieve your parcels",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
