// server.js – Minimal Render-Compatible GPS Backend

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// In-memory stores (reset on redeploy)
const latestByDevice = {};
const historyByDevice = {};

app.use(cors());
app.use(express.json());

// ---------- / ----------
app.get("/", (req, res) => {
  res.send("MMTT GPS Backend Running");
});

// ---------- /ingest ----------
app.post("/ingest", (req, res) => {
  const { device_id, lat, lon, speed, battery, sos, timestamp } = req.body;

  if (!device_id || typeof lat !== "number" || typeof lon !== "number") {
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

  res.json({ status: "ok" });
});

// ---------- /device/:id/latest ----------
app.get("/device/:id/latest", (req, res) => {
  const data = latestByDevice[req.params.id];
  if (!data) return res.status(404).json({ error: "No data" });
  res.json(data);
});

// ---------- /device/:id/history ----------
app.get("/device/:id/history", (req, res) => {
  res.json({
    coordinates: historyByDevice[req.params.id] || [],
  });
});

// ---------- /health ----------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
