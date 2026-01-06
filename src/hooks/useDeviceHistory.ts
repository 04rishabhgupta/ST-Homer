import { useState, useCallback } from 'react';
import { GPSLocation } from '@/types/gps';
import { API_ENDPOINTS } from '@/config/api';

interface UseDeviceHistoryReturn {
  history: GPSLocation[];
  isLoading: boolean;
  error: string | null;
  fetchHistory: (deviceId: string) => Promise<void>;
  clearHistory: () => void;
}

export const useDeviceHistory = (): UseDeviceHistoryReturn => {
  const [history, setHistory] = useState<GPSLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (deviceId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.getDeviceHistory(deviceId), {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.devices)) {
        setHistory(data.devices.map((loc: any) => ({
          device_id: loc.device_id,
          latitude: parseFloat(loc.lat || loc.latitude),
          longitude: parseFloat(loc.lon || loc.longitude),
          timestamp: loc.reading_time || loc.timestamp,
          ax: parseFloat(loc.ax) || 0,
          ay: parseFloat(loc.ay) || 0,
          az: parseFloat(loc.az) || 0,
        })));
      } else {
        throw new Error(data.message || 'Failed to fetch history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    isLoading,
    error,
    fetchHistory,
    clearHistory,
  };
};
