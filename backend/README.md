# GPS Tracking Backend API

A minimal backend API for real-time GPS tracking system that accepts location data from ESP32 devices and serves it to a React frontend.

## Installation

```bash
npm install
```

## Running Locally

```bash
npm start
```

The server will start on `http://localhost:4000` (or the port specified in `PORT` environment variable).

## API Endpoints

### POST /ingest

Accepts GPS data from ESP32 devices.

**Request Body:**
```json
{
  "device_id": "BSF_UNIT_01",
  "lat": 29.865912,
  "lon": 77.890332,
  "speed": 1.24,
  "battery": 82,
  "sos": false,
  "timestamp": 1733847391
}
```

**Required fields:**
- `device_id` (string)
- `lat` (number)
- `lon` (number)

**Optional fields:**
- `speed` (number)
- `battery` (number)
- `sos` (boolean)
- `timestamp` (number, unix seconds). If not provided, server time is used.

**Response:**
```json
{
  "status": "ok"
}
```

**Example curl:**
```bash
curl -X POST http://localhost:4000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "BSF_UNIT_01",
    "lat": 29.865912,
    "lon": 77.890332,
    "speed": 1.5,
    "battery": 90,
    "sos": false,
    "timestamp": 1733847391
  }'
```

### GET /device/:id/latest

Fetches the latest location for a specific device.

**Example:**
```bash
curl http://localhost:4000/device/BSF_UNIT_01/latest
```

**Response (if data exists):**
```json
{
  "device_id": "BSF_UNIT_01",
  "lat": 29.865912,
  "lon": 77.890332,
  "speed": 1.5,
  "battery": 90,
  "sos": false,
  "timestamp": 1733847391
}
```

**Response (if no data):**
```json
{
  "error": "No data"
}
```
Status: 404

### GET /device/:id/history

Fetches the historical path (all coordinates) for a specific device.

**Example:**
```bash
curl http://localhost:4000/device/BSF_UNIT_01/history
```

**Response:**
```json
{
  "coordinates": [
    {
      "device_id": "BSF_UNIT_01",
      "lat": 29.865912,
      "lon": 77.890332,
      "speed": 1.5,
      "battery": 90,
      "sos": false,
      "timestamp": 1733847391
    },
    ...
  ]
}
```

### GET /health

Health check endpoint for monitoring.

**Example:**
```bash
curl http://localhost:4000/health
```

**Response:**
```json
{
  "status": "ok"
}
```

## Deployment to Render

1. Create a new **Web Service** on Render
2. Connect your Git repository (or use Render's CLI)
3. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Render will automatically detect the `package.json` and set up the service
5. Your backend will be available at `https://your-service-name.onrender.com`

**Note:** Make sure to update the `API_BASE_URL` in your frontend to point to your Render backend URL.

## Storage

Currently uses in-memory storage (no database). Data will be lost when the server restarts. This is suitable for testing and development.

## CORS

CORS is enabled for all origins to allow the React frontend to make API calls.

