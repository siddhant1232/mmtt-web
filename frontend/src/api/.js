// server.js — Verbose Express + Socket.IO (drop-in; logs heavily)
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 4000;

// In-memory stores
const latestByDevice = {};
const historyByDevice = {};

app.use(cors());
app.use(express.json({ limit: "200kb" }));

// Root
app.get("/", (req, res) => res.send("MMTT Backend (Socket.IO verbose)"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // tighten later
});

// Track connected sockets and optionally which device rooms they joined
const sockets = new Map();

io.on("connection", (socket) => {
  console.log(`[SOCKET] connected id=${socket.id} ip=${socket.handshake.address}`);
  sockets.set(socket.id, { id: socket.id, connectedAt: Date.now() });

  socket.on("get_snapshot", () => {
    console.log(`[SOCKET] ${socket.id} requested snapshot`);
    socket.emit("devices_snapshot", latestByDevice);
  });

  socket.on("subscribe_device", (deviceId) => {
    console.log(`[SOCKET] ${socket.id} subscribe_device -> ${deviceId}`);
    socket.join(`device:${deviceId}`);
  });

  socket.on("unsubscribe_device", (deviceId) => {
    console.log(`[SOCKET] ${socket.id} unsubscribe_device -> ${deviceId}`);
    socket.leave(`device:${deviceId}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] disconnected id=${socket.id} reason=${reason}`);
    sockets.delete(socket.id);
  });

  socket.on("error", (err) => {
    console.error(`[SOCKET] error id=${socket.id}`, err);
  });
});

// Helper emit function with safe try/catch
function safeEmit(event, payload) {
  try {
    io.emit(event, payload);
    console.log(`[EMIT] event='${event}' payload=device:${payload.device_id} lat=${payload.lat} lon=${payload.lon}`);
    return true;
  } catch (err) {
    console.error("[EMIT] failed:", err);
    return false;
  }
}

// Ingest endpoint: store + emit
app.post("/ingest", (req, res) => {
  const t0 = Date.now();
  const body = req.body || {};
  console.log(`[HTTP] /ingest hit - body keys: ${Object.keys(body).join(", ")}`);

  const { device_id, lat, lon, speed, battery, sos, timestamp } = body;

  if (!device_id || typeof lat !== "number" || typeof lon !== "number") {
    console.warn("[HTTP] /ingest - validation failed:", body);
    return res.status(400).json({ error: "Invalid data" });
  }

  const point = {
    device_id,
    lat: Number(lat),
    lon: Number(lon),
    speed: speed ?? null,
    battery: battery ?? null,
    sos: !!sos,
    timestamp: timestamp || Date.now()
  };

  latestByDevice[device_id] = point;
  if (!historyByDevice[device_id]) historyByDevice[device_id] = [];
  historyByDevice[device_id].push(point);

  // Emit both broadcast and room-specific
  const okBroadcast = safeEmit("location_update", point);
  try {
    io.to(`device:${device_id}`).emit("location_update", point);
    console.log(`[EMIT-ROOM] device:${device_id} emitted`);
  } catch (err) {
    console.error("[EMIT-ROOM] failed:", err);
  }

  const dt = Date.now() - t0;
  console.log(`[HTTP] /ingest processed in ${dt}ms for device=${device_id}`);

  // respond last so client knows it was accepted
  return res.json({ status: "ok" });
});

// Latest & history endpoints
app.get("/device/:id/latest", (req, res) => {
  const id = req.params.id;
  const d = latestByDevice[id];
  if (!d) return res.status(404).json({ error: "No data" });
  res.json(d);
});

app.get("/device/:id/history", (req, res) => {
  const id = req.params.id;
  res.json({ coordinates: historyByDevice[id] || [] });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Extra debug route to list connected sockets quickly
app.get("/debug/sockets", (req, res) => {
  const arr = Array.from(sockets.values()).map(s => ({ id: s.id, connectedAt: s.connectedAt }));
  res.json({ count: arr.length, sockets: arr });
});

server.listen(PORT, () => {
  console.log(`Backend + Socket.IO running on port ${PORT}`);
});
