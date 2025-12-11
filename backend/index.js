// server.js (improved)
// Simple GPS ingest + latest + history with small production hardening

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'data.json'); // optional persistence
const MAX_HISTORY_PER_DEVICE = Number(process.env.MAX_HISTORY_PER_DEVICE || 500); // cap per device

// --- optional persistence: load existing data.json if present (useful in dev) ---
let latestByDevice = {};
let historyByDevice = {};
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readJsonSync(DB_FILE);
    latestByDevice = raw.latestByDevice || {};
    historyByDevice = raw.historyByDevice || {};
    console.log('Loaded persisted data.json');
  }
} catch (e) {
  console.warn('Failed to load data.json (continuing in-memory):', e.message);
}

// save helper (async, fire-and-forget)
async function persist() {
  try {
    await fs.writeJson(DB_FILE, { latestByDevice, historyByDevice }, { spaces: 2 });
  } catch (e) {
    console.error('Persist failed:', e.message);
  }
}

// --- middleware ---
app.use(helmet()); // secure headers
app.use(cors()); // adjust origin in production
app.use(express.json({ limit: '200kb' })); // limit payload size
app.use(morgan('combined'));

// basic rate limiter to avoid abuse
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 50, // per window per IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Helper function to validate location point
function validateLocationPoint(body) {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Invalid body' };
  if (!body.device_id || typeof body.device_id !== 'string') {
    return { valid: false, error: 'device_id is required and must be a string' };
  }
  if (typeof body.lat !== 'number' || Number.isNaN(body.lat)) {
    return { valid: false, error: 'lat is required and must be a number' };
  }
  if (typeof body.lon !== 'number' || Number.isNaN(body.lon)) {
    return { valid: false, error: 'lon is required and must be a number' };
  }
  return { valid: true };
}

// Root route – to confirm correct file is running
app.get('/', (req, res) => {
  res.send(
    'MMTT GPS Backend is running. Routes: POST /ingest, GET /device/:id/latest, GET /device/:id/history, GET /health, GET /debug/routes'
  );
});

// DEBUG: list all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = app._router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
    }));
  res.json(routes);
});

// POST /ingest - Accept GPS data from ESP32
app.post('/ingest', (req, res) => {
  try {
    // Log small summary (morgan already logs requests; this helps debugging payload)
    console.log('/ingest body device_id:', req.body && req.body.device_id);

    const validation = validateLocationPoint(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const {
      device_id,
      lat,
      lon,
      speed,
      battery,
      sos,
      timestamp,
    } = req.body;

    // Normalize timestamp to ISO string (if numeric unix provided, convert to ISO)
    const ts = timestamp
      ? (typeof timestamp === 'number' ? new Date(timestamp * (timestamp < 1e12 ? 1000 : 1)).toISOString() : String(timestamp))
      : new Date().toISOString();

    // Create location point
    const locationPoint = {
      device_id,
      lat: Number(lat),
      lon: Number(lon),
      speed: speed !== undefined ? Number(speed) : null,
      battery: battery !== undefined ? Number(battery) : null,
      sos: !!sos,
      timestamp: ts,
    };

    // Store as latest
    latestByDevice[device_id] = locationPoint;

    // Add to history and cap size
    if (!historyByDevice[device_id]) historyByDevice[device_id] = [];
    historyByDevice[device_id].push(locationPoint);
    if (historyByDevice[device_id].length > MAX_HISTORY_PER_DEVICE) {
      historyByDevice[device_id].splice(0, historyByDevice[device_id].length - MAX_HISTORY_PER_DEVICE);
    }

    // persist asynchronously (non-blocking)
    persist();

    // TODO: If you add Socket.IO, emit event here:
    // if (io) io.emit('device_update', { device_id, ...locationPoint });

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing ingest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /device/:id/latest - Get latest location for a device
app.get('/device/:id/latest', (req, res) => {
  try {
    const deviceId = req.params.id;
    const latest = latestByDevice[deviceId];

    if (!latest) {
      return res.status(404).json({ error: 'No data' });
    }

    res.json(latest);
  } catch (error) {
    console.error('Error fetching latest location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /device/:id/history - Get historical path for a device
app.get('/device/:id/history', (req, res) => {
  try {
    const deviceId = req.params.id;
    const history = historyByDevice[deviceId] || [];

    res.json({ coordinates: history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /health - Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`GPS Tracking Backend running on port ${PORT}`);
});
