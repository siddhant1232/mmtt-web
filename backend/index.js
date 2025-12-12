// server.js – Minimal Render-Compatible GPS Backend with LOGGING

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory stores (reset on redeploy)
const latestByDevice = {};
const historyByDevice = {};

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ---------- / ----------
app.get("/", (req, res) => {
  res.send("MMTT GPS Backend Running");
});

// ---------- /ingest ----------
app.post("/ingest", (req, res) => {
  console.log("📥 RECEIVED DATA:");
  console.log("  Raw body:", JSON.stringify(req.body));
  
  const { device_id, lat, lon, speed, battery, sos, timestamp } = req.body;

  if (!device_id || typeof lat !== "number" || typeof lon !== "number") {
    console.log("❌ VALIDATION FAILED:", { device_id, lat, lon });
    return res.status(400).json({ error: "Invalid data" });
  }

  const point = {
    device_id,
    lat,
    lon,
    speed: speed ?? null,
    battery: battery ?? null,
    sos: !!sos,
    timestamp: timestamp || Date.now(),
  };

  latestByDevice[device_id] = point;

  if (!historyByDevice[device_id]) historyByDevice[device_id] = [];
  historyByDevice[device_id].push(point);

  console.log("✅ DATA STORED:");
  console.log(`  Device: ${device_id}`);
  console.log(`  Location: ${lat}, ${lon}`);
  console.log(`  Total points for ${device_id}: ${historyByDevice[device_id].length}`);
  console.log(`  Total devices tracked: ${Object.keys(latestByDevice).length}`);

  res.json({ status: "ok" });
});

// ---------- /device/:id/latest ----------
app.get("/device/:id/latest", (req, res) => {
  console.log(`📍 Fetching latest for device: ${req.params.id}`);
  const data = latestByDevice[req.params.id];
  if (!data) {
    console.log(`❌ No data found for device: ${req.params.id}`);
    return res.status(404).json({ error: "No data" });
  }
  console.log(`✅ Returning latest data for ${req.params.id}`);
  res.json(data);
});

// ---------- /device/:id/history ----------
app.get("/device/:id/history", (req, res) => {
  console.log(`📜 Fetching history for device: ${req.params.id}`);
  const history = historyByDevice[req.params.id] || [];
  console.log(`✅ Returning ${history.length} points for ${req.params.id}`);
  res.json({
    coordinates: history,
  });
});

// ---------- /health ----------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- /debug (OPTIONAL - shows current state) ----------
app.get("/debug", (req, res) => {
  res.json({
    totalDevices: Object.keys(latestByDevice).length,
    devices: Object.keys(latestByDevice),
    latestData: latestByDevice,
    historyCounts: Object.keys(historyByDevice).reduce((acc, key) => {
      acc[key] = historyByDevice[key].length;
      return acc;
      
    }, {})
  });
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📡 Ready to receive GPS data`);
});
                  