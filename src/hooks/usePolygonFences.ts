import { useState, useCallback } from 'react';
import { PolygonFence } from '@/types/gps';

const STORAGE_KEY = 'polygon-fences';

const DEFAULT_FENCES: PolygonFence[] = [
  {
    id: '1',
    name: 'Crane Zone A',
    coordinates: [
      { lat: 28.5455, lng: 77.1920 },
      { lat: 28.5460, lng: 77.1930 },
      { lat: 28.5450, lng: 77.1935 },
      { lat: 28.5445, lng: 77.1925 },
    ],
    color: '#22c55e',
    shiftStart: '09:00',
    shiftEnd: '17:00',
  },
];

interface UsePolygonFencesReturn {
  fences: PolygonFence[];
  addFence: (fence: Omit<PolygonFence, 'id'>) => void;
  removeFence: (id: string) => void;
  updateFence: (id: string, updates: Partial<PolygonFence>) => void;
}

export const usePolygonFences = (): UsePolygonFencesReturn => {
  const [fences, setFences] = useState<PolygonFence[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_FENCES;
  });

  const saveFences = (newFences: PolygonFence[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFences));
    setFences(newFences);
  };

  const addFence = useCallback((fence: Omit<PolygonFence, 'id'>) => {
    const newFence: PolygonFence = {
      ...fence,
      id: Date.now().toString(),
    };
    saveFences([...fences, newFence]);
  }, [fences]);

  const removeFence = useCallback((id: string) => {
    saveFences(fences.filter(f => f.id !== id));
  }, [fences]);

  const updateFence = useCallback((id: string, updates: Partial<PolygonFence>) => {
    saveFences(fences.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [fences]);

  return { fences, addFence, removeFence, updateFence };
};
