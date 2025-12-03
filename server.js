// server.js

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
require("dotenv").config(); // only used if you have a .env locally

const app = express();

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json()); // for JSON bodies
app.use(express.urlencoded({ extended: true })); // for form-data without files

// if you ever send a screenshot, this will handle it (optional)
const upload = multer({ dest: "uploads/" });

// ====== TELEGRAM CONFIG ======
// 💡 On Render: set these in the "Environment" tab
// BOT_TOKEN = your bot token from BotFather
// CHAT_ID  = your Telegram chat id
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// If env vars missing, log a warning (helps you debug)
if (!BOT_TOKEN || !CHAT_ID) {
  console.warn("⚠️ BOT_TOKEN or CHAT_ID is NOT set in environment variables!");
  console.warn("Set them in Render dashboard → Environment.");
}

// ====== ROUTES ======

// Simple health check
app.get("/", (req, res) => {
  res.send("Backend is LIVE 🚀");
});

// For when you open /order in browser
app.get("/order", (req, res) => {
  res.send("Order endpoint is working, use POST to send data.");
});

// Main route that your website calls
app.post("/order", upload.single("screenshot"), async (req, res) => {
  try {
    // works for JSON body and form-data
    const { username, item, price } = req.body;

    if (!username || !item || !price) {
      return res.status(400).json({
        success: false,
        message: "username, item and price are required",
      });
    }

    const message = `
🛒 NEW ORDER

Item: ${item}
Price: ₹${price}
Telegram: @${username}
`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const tgRes = await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
    });

    console.log("Telegram response:", tgRes.data);

    return res.json({
      success: true,
      message: "Order sent to Telegram!",
    });
  } catch (err) {
    console.error("Telegram error:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send order to Telegram",
      error: err.response?.data || err.message,
    });
  }
});

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
