const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-key";

// 🔐 Check Mongo URI
if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing in .env");
  process.exit(1);
}

// 🗄️ MongoDB connect
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// 📩 Brevo transporter (GLOBAL)
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// 📦 Schema
const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", LeadSchema);

// 🏠 Routes
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Sanskar Web Solutions API is running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// 🚀 CREATE LEAD + EMAIL
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: "Name, email, and message are required."
      });
    }

    // 1️⃣ Save to DB
    const lead = await Lead.create({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : "",
      message: String(message).trim()
    });

    // 2️⃣ Instant response (FAST ⚡)
    res.status(201).json({
      ok: true,
      message: "Lead saved successfully",
      leadId: lead._id
    });

    // 3️⃣ Email in background 📩
    transporter.sendMail({
      from: `"Sanskar Web Solutions" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: "🔥 New Lead Received",
      text: `
New lead from website:

Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}
      `
    }).then(() => {
      console.log("📩 Email sent successfully");
    }).catch((err) => {
      console.log("❌ Email error:", err.message);
    });

  } catch (error) {
    console.error("POST /api/leads error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error"
    });
  }
});

// 🔐 GET LEADS (ADMIN)
app.get("/api/leads", async (req, res) => {
  try {
    const key = req.query.key;

    if (key !== ADMIN_KEY) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const leads = await Lead.find().sort({ createdAt: -1 });

    return res.json({ ok: true, leads });

  } catch (error) {
    console.error("GET /api/leads error:", error);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
