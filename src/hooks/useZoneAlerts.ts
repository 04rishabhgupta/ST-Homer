import { useState, useEffect, useCallback, useRef } from 'react';
import { GPSLocation, PolygonFence, WorkerAssignment } from '@/types/gps';
import { isPointInPolygon, isWithinShift } from '@/lib/geoUtils';
import { toast } from 'sonner';

export interface ZoneAlert {
  id: string;
  workerId: string;
  fenceId: string;
  fenceName: string;
  timestamp: Date;
  type: 'out-of-zone';
}

interface ViolationTracker {
  workerId: string;
  startTime: number;
  alerted: boolean;
}

interface UseZoneAlertsOptions {
  outOfZoneAlertDelaySeconds: number;
}

interface UseZoneAlertsReturn {
  alerts: ZoneAlert[];
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
}

export const useZoneAlerts = (
  locations: GPSLocation[],
  fences: PolygonFence[],
  assignments: WorkerAssignment[],
  options: UseZoneAlertsOptions
): UseZoneAlertsReturn => {
  const [alerts, setAlerts] = useState<ZoneAlert[]>([]);
  const violationTrackerRef = useRef<Map<string, ViolationTracker>>(new Map());

  const { outOfZoneAlertDelaySeconds } = options;

  // Get latest location per device
  const getLatestLocations = useCallback((): Map<string, GPSLocation> => {
    const deviceMap = new Map<string, GPSLocation>();
    locations.forEach(loc => {
      const existing = deviceMap.get(loc.device_id);
      if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
        deviceMap.set(loc.device_id, loc);
      }
    });
    return deviceMap;
  }, [locations]);

  // Check if a worker is currently in violation
  const isWorkerInViolation = useCallback((
    workerId: string,
    location: GPSLocation
  ): { inViolation: boolean; fence: PolygonFence | null } => {
    const assignment = assignments.find(a => a.workerId === workerId);
    if (!assignment) return { inViolation: false, fence: null };

    const fence = fences.find(f => f.id === assignment.fenceId);
    if (!fence) return { inViolation: false, fence: null };

    const now = new Date();
    const withinShift = isWithinShift(now, fence.shiftStart, fence.shiftEnd);
    
    // Only check violations during shift hours
    if (!withinShift) return { inViolation: false, fence: null };

    const insideFence = isPointInPolygon(
      { lat: location.latitude, lng: location.longitude },
      fence.coordinates
    );

    return { inViolation: !insideFence, fence };
  }, [assignments, fences]);

  // Main effect to track violations and trigger alerts after delay
  useEffect(() => {
    const latestLocations = getLatestLocations();
    const now = Date.now();
    const delayMs = outOfZoneAlertDelaySeconds * 1000;
    const tracker = violationTrackerRef.current;

    // Check each assigned worker
    assignments.forEach(assignment => {
      const location = latestLocations.get(assignment.workerId);
      if (!location) return;

      const { inViolation, fence } = isWorkerInViolation(assignment.workerId, location);
      const existing = tracker.get(assignment.workerId);

      if (inViolation && fence) {
        if (!existing) {
          // Start tracking this violation
          tracker.set(assignment.workerId, {
            workerId: assignment.workerId,
            startTime: now,
            alerted: false,
          });
        } else if (!existing.alerted && (now - existing.startTime) >= delayMs) {
          // Delay has passed, trigger alert
          const alertId = `${assignment.workerId}-${now}`;
          const newAlert: ZoneAlert = {
            id: alertId,
            workerId: assignment.workerId,
            fenceId: fence.id,
            fenceName: fence.name,
            timestamp: new Date(),
            type: 'out-of-zone',
          };

          setAlerts(prev => {
            // Avoid duplicate alerts for same worker
            if (prev.some(a => a.workerId === assignment.workerId && !a.id.includes('cleared'))) {
              return prev;
            }
            return [...prev, newAlert];
          });

          // Show toast notification
          toast.error(`Zone Violation: ${assignment.workerId}`, {
            description: `Worker has been outside "${fence.name}" for ${outOfZoneAlertDelaySeconds}+ seconds`,
            duration: 5000,
          });

          // Mark as alerted
          tracker.set(assignment.workerId, { ...existing, alerted: true });
        }
      } else {
        // Worker is back in zone or not in violation, clear tracking
        if (existing) {
          tracker.delete(assignment.workerId);
        }
      }
    });

    // Clean up trackers for workers no longer assigned
    const assignedWorkerIds = new Set(assignments.map(a => a.workerId));
    tracker.forEach((_, workerId) => {
      if (!assignedWorkerIds.has(workerId)) {
        tracker.delete(workerId);
      }
    });
  }, [locations, assignments, fences, outOfZoneAlertDelaySeconds, getLatestLocations, isWorkerInViolation]);

  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    violationTrackerRef.current.clear();
  }, []);

  return {
    alerts,
    clearAlert,
    clearAllAlerts,
  };
};
