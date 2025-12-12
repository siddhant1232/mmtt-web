import { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ScaleControl,
  useMap,
} from 'react-leaflet';
import { Icon } from 'leaflet';
import { fetchLatestLocation, fetchHistory } from './api/trackingapp.js';
import './App.css';

// Fix for default marker icon in React-Leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Small helper component to recenter map when target moves
function RecenterOnTarget({ lat, lon }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon]);
    }
  }, [lat, lon, map]);

  return null;
}

function App() {
  const [deviceId, setDeviceId] = useState('esp01');
  const [latestLocation, setLatestLocation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [followTarget, setFollowTarget] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [mapStyle, setMapStyle] = useState('standard');

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
        fetchHistory(deviceId),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, deviceId]);

  // Prepare polyline coordinates
  const polylineCoordinates = history.map((point) => [point.lat, point.lon]);

  // Calculate map center
  const fallbackCenter = [29.866, 77.8905]; // Roorkee-ish default
  const mapCenter = latestLocation
    ? [latestLocation.lat, latestLocation.lon]
    : fallbackCenter;

  // Choose tile style (you can later swap with your own tiles / Google-like tiles)
  const tileUrl =
    mapStyle === 'standard'
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="app-root">
      {/* Top BSF header */}
      <header className="bsf-header">
        <div className="bsf-title">
          <span className="bsf-badge">BSF</span>
          <div>
            <h1>Multi-Mode Tactical Tracker</h1>
            <p>Live field unit situational awareness</p>
          </div>
        </div>

        <div className="bsf-status">
          <span className="status-dot online" />
          <span>Backend: Online</span>
        </div>
      </header>

      <div className="layout">
        {/* Left control panel */}
        <aside className="control-panel">
          <div className="panel-section">
            <h2>Target Control</h2>
            <label htmlFor="deviceId" className="field-label">
              Device ID
            </label>
            <div className="device-row">
              <input
                id="deviceId"
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="esp01"
              />
              <button
                className="btn primary"
                onClick={loadData}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />{' '}
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

            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={followTarget}
                  onChange={(e) => setFollowTarget(e.target.checked)}
                />{' '}
                Follow target
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showPath}
                  onChange={(e) => setShowPath(e.target.checked)}
                />{' '}
                Show path
              </label>
            </div>

            <div className="toggle-row">
              <span>Map style</span>
              <div className="map-style-toggle">
                <button
                  className={
                    mapStyle === 'standard' ? 'btn small active' : 'btn small'
                  }
                  onClick={() => setMapStyle('standard')}
                >
                  Standard
                </button>
                <button
                  className={
                    mapStyle === 'dark' ? 'btn small active' : 'btn small'
                  }
                  onClick={() => setMapStyle('dark')}
                >
                  Night Ops
                </button>
              </div>
            </div>
          </div>

          {latestLocation && (
            <div className="panel-section device-info">
              <h2>Unit Snapshot</h2>
              <h3>{latestLocation.device_id}</h3>
              <div className="info-grid">
                <div>
                  <span className="label">Location</span>
                  <span>
                    {latestLocation.lat.toFixed(6)},{' '}
                    {latestLocation.lon.toFixed(6)}
                  </span>
                </div>
                {latestLocation.speed !== null && (
                  <div>
                    <span className="label">Speed</span>
                    <span>{latestLocation.speed.toFixed(2)} m/s</span>
                  </div>
                )}
                {latestLocation.battery !== null && (
                  <div>
                    <span className="label">Battery</span>
                    <span>{latestLocation.battery}%</span>
                  </div>
                )}
                <div>
                  <span className="label">SOS</span>
                  <span className={latestLocation.sos ? 'sos active' : 'sos'}>
                    {latestLocation.sos ? '⚠ ACTIVE' : 'Normal'}
                  </span>
                </div>
                <div>
                  <span className="label">Track points</span>
                  <span>{history.length}</span>
                </div>
                <div>
                  <span className="label">Last update</span>
                  <span>
                    {new Date(
                      latestLocation.timestamp * 1000,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="panel-section error-box">{error}</div>}
        </aside>

        {/* Map area */}
        <main className="map-shell">
          <MapContainer
            center={mapCenter}
            zoom={13}
            zoomControl={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url={tileUrl}
            />

            <ScaleControl position="bottomleft" />

            {/* Auto-recenter when following target */}
            {followTarget && latestLocation && (
              <RecenterOnTarget
                lat={latestLocation.lat}
                lon={latestLocation.lon}
              />
            )}

            {/* Historical path polyline */}
            {showPath && polylineCoordinates.length > 1 && (
              <Polyline
                positions={polylineCoordinates}
                pathOptions={{
                  color: '#ff8c00', // BSF-ish saffron/orange
                  weight: 4,
                  opacity: 0.85,
                }}
              />
            )}

            {/* Latest location marker */}
            {latestLocation && (
              <Marker
                position={[latestLocation.lat, latestLocation.lon]}
              >
                <Popup>
                  <div className="popup-content">
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
                        <strong style={{ color: 'red' }}>
                          ⚠ SOS ACTIVE
                        </strong>
                      </>
                    )}
                    <br />
                    <small>
                      {new Date(
                        latestLocation.timestamp * 1000,
                      ).toLocaleString()}
                    </small>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </main>
      </div>
    </div>
  );
}

export default App;
