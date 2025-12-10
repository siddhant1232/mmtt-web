import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { fetchLatestLocation, fetchHistory } from './api/trackingApi';
import './App.css';

// Fix for default marker icon in React-Leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function App() {
  const [deviceId, setDeviceId] = useState('BSF_UNIT_01');
  const [latestLocation, setLatestLocation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch data function
  const loadData = async () => {
    if (!deviceId.trim()) {
      setError('Please enter a device ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [latest, historyData] = await Promise.all([
        fetchLatestLocation(deviceId),
        fetchHistory(deviceId)
      ]);

      setLatestLocation(latest);
      setHistory(historyData);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, deviceId]);

  // Prepare polyline coordinates
  const polylineCoordinates = history.map(point => [point.lat, point.lon]);

  // Calculate map center
  const mapCenter = latestLocation
    ? [latestLocation.lat, latestLocation.lon]
    : [29.8660, 77.8905]; // Default center

  return (
    <div className="app">
      <div className="controls">
        <div className="control-group">
          <label htmlFor="deviceId">Device ID:</label>
          <input
            id="deviceId"
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="BSF_UNIT_01"
          />
          <button onClick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh ({refreshInterval / 1000}s)
          </label>
          <input
            type="range"
            min="2000"
            max="30000"
            step="1000"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
          />
        </div>

        {latestLocation && (
          <div className="device-info">
            <h3>Device: {latestLocation.device_id}</h3>
            <div className="info-grid">
              <div>
                <strong>Location:</strong> {latestLocation.lat.toFixed(6)}, {latestLocation.lon.toFixed(6)}
              </div>
              {latestLocation.speed !== null && (
                <div>
                  <strong>Speed:</strong> {latestLocation.speed.toFixed(2)} m/s
                </div>
              )}
              {latestLocation.battery !== null && (
                <div>
                  <strong>Battery:</strong> {latestLocation.battery}%
                </div>
              )}
              <div>
                <strong>SOS:</strong> {latestLocation.sos ? '⚠️ ACTIVE' : '✓ Normal'}
              </div>
              <div>
                <strong>Points:</strong> {history.length}
              </div>
              <div>
                <strong>Last Update:</strong>{' '}
                {new Date(latestLocation.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </div>

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Historical path polyline */}
          {polylineCoordinates.length > 1 && (
            <Polyline
              positions={polylineCoordinates}
              color="blue"
              weight={3}
              opacity={0.7}
            />
          )}

          {/* Latest location marker */}
          {latestLocation && (
            <Marker position={[latestLocation.lat, latestLocation.lon]}>
              <Popup>
                <div>
                  <strong>{latestLocation.device_id}</strong>
                  <br />
                  Lat: {latestLocation.lat.toFixed(6)}
                  <br />
                  Lon: {latestLocation.lon.toFixed(6)}
                  {latestLocation.speed !== null && (
                    <>
                      <br />
                      Speed: {latestLocation.speed.toFixed(2)} m/s
                    </>
                  )}
                  {latestLocation.battery !== null && (
                    <>
                      <br />
                      Battery: {latestLocation.battery}%
                    </>
                  )}
                  {latestLocation.sos && (
                    <>
                      <br />
                      <strong style={{ color: 'red' }}>⚠️ SOS ACTIVE</strong>
                    </>
                  )}
                  <br />
                  <small>
                    {new Date(latestLocation.timestamp * 1000).toLocaleString()}
                  </small>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;

