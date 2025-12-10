# GPS Tracking System

A full-stack real-time GPS tracking system with a Node.js/Express backend and React frontend.

## Project Structure

```
mmtt-002/
├── backend/          # Express.js API server
│   ├── index.js      # Main server file
│   ├── package.json  # Backend dependencies
│   └── README.md     # Backend documentation
│
└── frontend/         # React frontend application
    ├── src/
    │   ├── api/      # API client functions
    │   ├── App.jsx   # Main React component
    │   └── ...
    ├── package.json  # Frontend dependencies
    └── README.md     # Frontend documentation
```

## Quick Start

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The backend will run on `http://localhost:4000`

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Testing the System

### 1. Send GPS Data (Simulate ESP32)

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

### 2. View in Frontend

1. Open `http://localhost:5173` in your browser
2. Enter device ID: `BSF_UNIT_01`
3. Click "Refresh" to see the location on the map

## Deployment

### Backend to Render

1. Create a new Web Service on Render
2. Connect your Git repository
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Your backend will be available at `https://your-service.onrender.com`

### Frontend

1. Update `VITE_API_BASE_URL` in `.env` or `src/api/trackingApi.js` to your Render backend URL
2. Build: `npm run build`
3. Deploy the `dist` folder to any static hosting (Vercel, Netlify, etc.)

## API Endpoints

- `POST /ingest` - Accept GPS data from ESP32
- `GET /device/:id/latest` - Get latest location
- `GET /device/:id/history` - Get historical path
- `GET /health` - Health check

See `backend/README.md` for detailed API documentation.

## Features

- ✅ Real-time GPS data ingestion
- ✅ In-memory storage (no database required)
- ✅ RESTful API endpoints
- ✅ Interactive map visualization
- ✅ Historical path tracking
- ✅ Auto-refresh functionality
- ✅ CORS enabled for frontend access
- ✅ Ready for Render deployment

## Next Steps

- Add database persistence (PostgreSQL, MongoDB, etc.)
- Add authentication/authorization
- Add WebSocket support for real-time updates
- Add multiple device management
- Add geofencing alerts

