// server.js
// Pure Node.js backend: no external modules needed

const http = require("http");
const https = require("https");

// ✅ Set these in Render environment variables
// In Render dashboard → Your Service → Environment:
// BOT_TOKEN = your bot token from BotFather
// CHAT_ID  = your Telegram user chat id
const BOT_TOKEN = process.env.8478993597:AAET60NQeyO3ZbWoG-_qWd8iB1Jc89foIO8;
const CHAT_ID = process.env.6273207229;

if (!BOT_TOKEN || !CHAT_ID) {
  console.log("⚠️ BOT_TOKEN or CHAT_ID is missing. Set them in Render env vars.");
}

// Helper: send JSON response with CORS
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

// Helper: send plain text
function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(text);
}

// Helper: send message to Telegram
function sendTelegramMessage(text, callback) {
  if (!BOT_TOKEN || !CHAT_ID) {
    callback(new Error("BOT_TOKEN or CHAT_ID not set"));
    return;
  }

  const payload = JSON.stringify({
    chat_id: CHAT_ID,
    text: text,
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (tgRes) => {
    let data = "";
    tgRes.on("data", (chunk) => (data += chunk));
    tgRes.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        if (!parsed.ok) {
          callback(new Error(parsed.description || "Telegram API error"));
        } else {
          callback(null, parsed);
        }
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on("error", (e) => {
    callback(e);
  });

  req.write(payload);
  req.end();
}

// HTTP server
const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // Health check
  if (urlPath === "/" && method === "GET") {
    return sendText(res, 200, "Backend is LIVE 🚀 (Telegram ready)");
  }

  // Check /order in browser
  if (urlPath === "/order" && method === "GET") {
    return sendText(res, 200, "Order endpoint working. Send POST /order with JSON.");
  }

  // MAIN ROUTE: POST /order from your website
  if (urlPath === "/order" && method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.socket.destroy();
      }
    });

    req.on("end", () => {
      let data;
      try {
        data = JSON.parse(body || "{}");
      } catch (e) {
        return sendJson(res, 400, {
          success: false,
          message: "Invalid JSON",
        });
      }

      const username = data.username;
      const item = data.item;
      const price = data.price;

      if (!username || !item || !price) {
        return sendJson(res, 400, {
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

      sendTelegramMessage(message, (err, tgRes) => {
        if (err) {
          console.error("Telegram error:", err.message);
          return sendJson(res, 500, {
            success: false,
            message: "Failed to send order to Telegram",
            error: err.message,
          });
        }

        console.log("Telegram OK:", tgRes);
        return sendJson(res, 200, {
          success: true,
          message: "Order sent to Telegram!",
        });
      });
    });

    return;
  }

  // Anything else → 404
  sendText(res, 404, "Not found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
