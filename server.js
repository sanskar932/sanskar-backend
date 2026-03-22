const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios"); // ✅ added
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-key";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

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

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Sanskar Web Solutions API is running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: "Name, email, and message are required."
      });
    }

    const lead = await Lead.create({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : "",
      message: String(message).trim()
    });

    // ⚡ Fast response
    res.status(201).json({
      ok: true,
      message: "Lead saved successfully",
      leadId: lead._id
    });

    // 📩 EMAIL VIA API (background)
    axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Sanskar Web Solutions",
          email: "sanskargupta1295@gmail.com"
        },
        to: [
          {
            email: "sanskargupta1295@gmail.com"
          }
        ],
        subject: "🔥 New Lead Received",
        textContent: `
New lead from website:

Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    )
    .then(() => console.log("📩 Email sent via API"))
    .catch((err) =>
      console.log("❌ API email error:", err.response?.data || err.message)
    );

  } catch (error) {
    console.error("POST /api/leads error:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error"
    });
  }
});

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
