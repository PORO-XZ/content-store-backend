const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Backend is LIVE 🚀");
});
const upload = multer({ dest: "uploads/" });

// SET THESE 👇
const TOKEN = "8478993597:AAET60NQeyO3ZbWoG-_qWd8iB1Jc89foIO8";
const CHAT_ID = "6273207229";

app.post("/order", upload.single("screenshot"), async (req, res) => {
  const { username, item, price } = req.body;

  const message = `
🛒 NEW ORDER

Item: ${item}
Price: ₹${price}
Telegram: @${username}
`;

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
  });

  res.json({ success: true, message: "Order sent to Telegram!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
