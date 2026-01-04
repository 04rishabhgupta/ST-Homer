export interface GPSLocation {
  id: number;
  device_id: string;
  latitude: number;
  longitude: number;
  ax: number;
  ay: number;
  az: number;
  timestamp: string;
}

export interface Geofence {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  color: string;
}

export interface DeviceStatus {
  device_id: string;
  isOnline: boolean;
  lastUpdate: Date;
  currentPosition: { lat: number; lng: number };
  accelerometer: { ax: number; ay: number; az: number };
}
