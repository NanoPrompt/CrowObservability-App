// 1. Core Built-in Modules must be initialized first!
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const scanPath = path.join(ROOT, "config/latest_compliance_scan.json");

// 2. Native Environment Parser (Loads your local .env credentials)
const envPath = path.join(ROOT, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valParts] = trimmed.split("=");
      if (key && valParts.length) process.env[key.trim()] = valParts.join("=").trim();
    }
  });
}

const PORT = process.env.PORT || 3000;
const EXPECTED_KEY = process.env.CROW_API_KEY || "crow_dev_fallback_secret_key";

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".json": "application/json"
};

// 3. Primary Network Processing Core
const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";

  // Dynamic API GET Portal: Serves external testing data live to your layout
  if (req.method === "GET" && reqPath === "/api/live-scans") {
    fs.readFile(scanPath, "utf8", (err, data) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(err ? JSON.stringify([]) : data);
    });
    return;
  }

  // Dynamic API POST Portal: Secure Webhook ingest layer protected by Bearer Tokens
  if (req.method === "POST" && reqPath === "/api/report-compliance") {
    const authHeader = req.headers["authorization"];
    if (!authHeader || authHeader !== `Bearer ${EXPECTED_KEY}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized: Invalid or missing API key." }));
    }

    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      try {
        JSON.parse(body); // Validate incoming integrity
        fs.mkdirSync(path.dirname(scanPath), { recursive: true });
        fs.writeFile(scanPath, body, "utf8", (err) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Failed to persist log array." }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "success", message: "Data synchronized successfully." }));
        });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid payload formatting. Expected JSON array." }));
      }
    });
    return;
  }

  // Static UI File Hosting Logic
  const filePath = path.join(ROOT, reqPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("404 Not Found: " + reqPath);
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`CrowObservability running dynamically at http://localhost:${PORT}`);
});