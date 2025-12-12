// ============================
// API CONFIGURATION
// ============================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://mmtt-web.onrender.com";

console.log("%c[API INIT] Using base URL:", "color: #00aaff", API_BASE_URL);

/**
 * Fetch the latest location of a device.
 * Debug logs added for tracing failures.
 */
export const fetchLatestLocation = async (deviceId) => {
  const url = `${API_BASE_URL}/device/${deviceId}/latest`;

  console.log("%c[API] fetchLatestLocation →", "color: #ffaa00", url);

  try {
    const response = await fetch(url);

    console.log(
      "%c[API] Response Status:",
      "color: #ffaa00",
      response.status
    );

    if (response.status === 404) {
      console.warn(
        `%c[API] No GPS data yet for device: ${deviceId}`,
        "color: #ff4444"
      );
      return null;
    }

    if (!response.ok) {
      console.error(
        "%c[API] Non-OK Response:",
        "color: red",
        response.status
      );
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    console.log("%c[API] Latest Location Data:", "color: #00cc66", data);

    return data;

  } catch (error) {
    console.error(
      "%c[API] Error fetching latest location:",
      "color: red",
      error
    );
    return null;
  }
};

/**
 * Fetch historical movement path for a device.
 * Debug logs added for tracing failures.
 */
export const fetchHistory = async (deviceId) => {
  const url = `${API_BASE_URL}/device/${deviceId}/history`;

  console.log("%c[API] fetchHistory →", "color: #ffaa00", url);

  try {
    const response = await fetch(url);

    console.log(
      "%c[API] History Response Status:",
      "color: #ffaa00",
      response.status
    );

    if (!response.ok) {
      console.warn(
        "%c[API] History returned non-OK; returning empty array",
        "color: #ff8800"
      );
      return [];
    }

    const data = await response.json();

    console.log("%c[API] History Data:", "color: #00cc66", data);

    return data.coordinates || [];

  } catch (error) {
    console.error(
      "%c[API] Error fetching history:",
      "color: red",
      error
    );
    return [];
  }
};