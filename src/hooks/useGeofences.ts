import { useState, useCallback } from 'react';
import { Geofence } from '@/types/gps';

const STORAGE_KEY = 'gps-dashboard-geofences';

const DEFAULT_GEOFENCES: Geofence[] = [
  {
    id: '1',
    name: 'Main Building',
    center: { lat: 28.5450, lng: 77.1926 },
    radius: 100,
    color: '#22c55e',
  },
  {
    id: '2',
    name: 'Parking Area',
    center: { lat: 28.5440, lng: 77.1910 },
    radius: 50,
    color: '#3b82f6',
  },
];

interface UseGeofencesReturn {
  geofences: Geofence[];
  addGeofence: (geofence: Omit<Geofence, 'id'>) => void;
  removeGeofence: (id: string) => void;
  updateGeofence: (id: string, updates: Partial<Geofence>) => void;
  checkDeviceInGeofence: (lat: number, lng: number) => Geofence[];
}

export const useGeofences = (): UseGeofencesReturn => {
  const [geofences, setGeofences] = useState<Geofence[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_GEOFENCES;
  });

  const saveGeofences = (newGeofences: Geofence[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGeofences));
    setGeofences(newGeofences);
  };

  const addGeofence = useCallback((geofence: Omit<Geofence, 'id'>) => {
    const newGeofence: Geofence = {
      ...geofence,
      id: Date.now().toString(),
    };
    saveGeofences([...geofences, newGeofence]);
  }, [geofences]);

  const removeGeofence = useCallback((id: string) => {
    saveGeofences(geofences.filter(g => g.id !== id));
  }, [geofences]);

  const updateGeofence = useCallback((id: string, updates: Partial<Geofence>) => {
    saveGeofences(geofences.map(g => 
      g.id === id ? { ...g, ...updates } : g
    ));
  }, [geofences]);

  const checkDeviceInGeofence = useCallback((lat: number, lng: number): Geofence[] => {
    return geofences.filter(geofence => {
      const distance = getDistanceFromLatLonInMeters(
        lat, lng,
        geofence.center.lat, geofence.center.lng
      );
      return distance <= geofence.radius;
    });
  }, [geofences]);

  return {
    geofences,
    addGeofence,
    removeGeofence,
    updateGeofence,
    checkDeviceInGeofence,
  };
};

// Haversine formula to calculate distance between two points
function getDistanceFromLatLonInMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
