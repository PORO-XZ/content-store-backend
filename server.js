// server.js

const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Telegram ENV
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const CHAT_ID = process.env.CHAT_ID || "";

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Backend is LIVE 🚀");
});

// ✅ Prevent Cannot GET
app.get("/order", (req, res) => {
  res.send("Order endpoint is working, use POST to send data.");
});

// ✅ Debug ENV
app.get("/debug", (req, res) => {
  res.json({
    hasToken: !!BOT_TOKEN,
    hasChatId: !!CHAT_ID
  });
});

// ✅ Test Telegram
app.get("/test-telegram", async (req, res) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).send("Missing BOT_TOKEN or CHAT_ID");
  }

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: "Test message from backend ✅"
    });

    res.send("✅ Telegram test message sent!");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("❌ Failed to send Telegram message");
  }
});

// ✅ ORDER ROUTE (FIXED)
app.post("/order", async (req, res) => {
  try {
    const { username, item, price } = req.body;

    if (!username || !item || !price) {
      return res.status(400).json({
        success: false,
        message: "username, item and price are required"
      });
    }

    const message = `
🛒 NEW ORDER

Item: ${item}
Price: ₹${price}
Telegram: @${username}
`;

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message
    });

    res.json({
      success: true,
      message: "Order sent to Telegram ✅"
    });

  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "Telegram failed",
      error: err.response?.data || err.message
    });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
