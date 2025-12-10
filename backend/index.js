const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const latestByDevice = {};
const historyByDevice = {};

// Helper function to validate location point
function validateLocationPoint(body) {
  if (!body.device_id || typeof body.device_id !== 'string') {
    return { valid: false, error: 'device_id is required and must be a string' };
  }
  if (typeof body.lat !== 'number' || isNaN(body.lat)) {
    return { valid: false, error: 'lat is required and must be a number' };
  }
  if (typeof body.lon !== 'number' || isNaN(body.lon)) {
    return { valid: false, error: 'lon is required and must be a number' };
  }
  return { valid: true };
}
app.get("/", (req, res) => {
  res.send("MMTT GPS Backend is running. Routes: POST /ingest, GET /device/:id/latest, GET /device/:id/history, GET /health");
});
// POST /ingest - Accept GPS data from ESP32
app.post('/ingest', (req, res) => {
  try {
    console.log('🔥 /ingest hit with body:', req.body);
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
      timestamp
    } = req.body;

    // Create location point
    const locationPoint = {
      device_id,
      lat,
      lon,
      speed: speed !== undefined ? speed : null,
      battery: battery !== undefined ? battery : null,
      sos: sos !== undefined ? sos : false,
      timestamp: timestamp || Math.floor(Date.now() / 1000)
    };

    // Store as latest
    latestByDevice[device_id] = locationPoint;

    // Add to history
    if (!historyByDevice[device_id]) {
      historyByDevice[device_id] = [];
    }
    historyByDevice[device_id].push(locationPoint);

    res.json({ status: 'ok' });
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

