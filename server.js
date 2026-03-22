const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ENV variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_KEY = process.env.ADMIN_KEY;

// MongoDB connect
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// Schema
const LeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model("Lead", LeadSchema);

// Home route
app.get("/", (req, res) => {
  res.json({ ok: true });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Create lead
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, message: "Missing fields" });
    }

    // Save to DB
    const lead = await Lead.create({
      name,
      email,
      phone,
      message
    });

    // Send response FAST
    res.status(201).json({ ok: true });

    // Email in background
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    transporter.sendMail({
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: "🔥 New Lead Received",
      text: `
New lead from website:

Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}
      `
    }).catch(err => console.log("Email Error:", err));

  } catch (error) {
    console.log("Server Error:", error);
    res.status(500).json({ ok: false });
  }
});

// Get leads (admin)
app.get("/api/leads", async (req, res) => {
  try {
    const key = req.query.key;

    if (key !== ADMIN_KEY) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const leads = await Lead.find().sort({ createdAt: -1 });

    res.json({ ok: true, leads });

  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
