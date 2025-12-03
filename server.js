// server.js
// No external modules. Only built-in Node stuff.

const http = require("http");
const https = require("https");

// Read from environment (set these on Render)
const BOT_TOKEN = process.env.8478993597:AAET60NQeyO3ZbWoG-_qWd8iB1Jc89foIO88478993597:AAET60NQeyO3ZbWoG-_qWd8iB1Jc89foIO8;
const CHAT_ID = process.env.6273207229;

if (!BOT_TOKEN || !CHAT_ID) {
  console.log("⚠️ BOT_TOKEN or CHAT_ID is missing. Set them in Render env vars.");
}

// Helper: send response as JSON
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",          // CORS
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

// Helper: send message to Telegram using https
function sendTelegramMessage(text, callback) {
  if (!BOT_TOKEN || !CHAT_ID) {
    callback(new Error("BOT_TOKEN or CHAT_ID not set"));
    return;
  }

  const postData = JSON.stringify({
    chat_id: CHAT_ID,
    text: text,
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
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

  req.write(postData);
  req.end();
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  // Root: quick check
  if (req.url === "/" && req.method === "GET") {
    return sendText(res, 200, "Backend is LIVE 🚀 (no external modules)");
  }

  // GET /order just to test in browser
  if (req.url === "/order" && req.method === "GET") {
    return sendText(res, 200, "Order endpoint working. Use POST /order with JSON.");
  }

  // POST /order — main route used by your website
  if (req.url === "/order" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      // safety: limit body size
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

  // If nothing matched → 404
  sendText(res, 404, "Not found");
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
