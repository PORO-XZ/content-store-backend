// server.js

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚙️ Multer setup (store file in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

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

// ✅ Test Telegram (simple text)
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

// ✅ ORDER ROUTE — sends message + screenshot
// expects multipart/form-data with fields:
//  - username
//  - item
//  - price
//  - paymentScreenshot (file)
app.post("/order", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const { username, item, price } = req.body;
    const file = req.file;

    if (!username || !item || !price) {
      return res.status(400).json({
        success: false,
        message: "username, item and price are required"
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "paymentScreenshot file is required"
      });
    }

    // make sure username has @ only once
    const formattedUsername = username.startsWith("@")
      ? username
      : `@${username}`;

    const caption = `
🛒 NEW ORDER

Item: ${item}
Price: ₹${price}
Telegram: ${formattedUsername}
`.trim();

    // build form-data for Telegram sendPhoto
    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("caption", caption);
    formData.append("photo", file.buffer, {
      filename: file.originalname || "payment.jpg",
      contentType: file.mimetype
    });

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    res.json({
      success: true,
      message: "Order (with screenshot) sent to Telegram ✅"
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
