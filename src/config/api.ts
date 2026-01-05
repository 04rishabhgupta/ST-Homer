// API Configuration - Using Edge Function as HTTPS proxy
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const API_BASE_URL = `${SUPABASE_URL}/functions/v1/api-proxy`;

export const API_ENDPOINTS = {
  getLocations: `${API_BASE_URL}?action=get_locations`,
  getDeviceHistory: (deviceId: string) => `${API_BASE_URL}?action=get_history&device_id=${deviceId}`,
};

// Map configuration
export const MAP_CONFIG = {
  defaultCenter: { lat: 28.5450, lng: 77.1926 }, // IIT Delhi
  defaultZoom: 16,
};

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  live: 5000, // 5 seconds for live tracking
  history: 30000, // 30 seconds for history
};
