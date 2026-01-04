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
      const response = await fetch(API_ENDPOINTS.getDeviceHistory(deviceId));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setHistory(data.data.map((loc: any) => ({
          ...loc,
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
          ax: parseFloat(loc.ax),
          ay: parseFloat(loc.ay),
          az: parseFloat(loc.az),
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
