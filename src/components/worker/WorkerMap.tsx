import { useCallback, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from '@react-google-maps/api';
import { GPSLocation, PolygonFence } from '@/types/gps';
import { MAP_CONFIG } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';
import { getPolygonCenter } from '@/lib/geoUtils';

interface WorkerMapProps {
  workerLocation: GPSLocation | null;
  assignedFence: PolygonFence | null;
  isInsideFence: boolean;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

export const WorkerMap = ({
  workerLocation,
  assignedFence,
  isInsideFence,
}: WorkerMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const center = assignedFence
    ? getPolygonCenter(assignedFence.coordinates)
    : workerLocation
    ? { lat: workerLocation.latitude, lng: workerLocation.longitude }
    : MAP_CONFIG.defaultCenter;

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load Google Maps</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please check your API key configuration
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={17}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      {/* Assigned Fence */}
      {assignedFence && (
        <Polygon
          paths={assignedFence.coordinates}
          options={{
            fillColor: assignedFence.color,
            fillOpacity: 0.2,
            strokeColor: assignedFence.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      )}

      {/* Worker Location */}
      {workerLocation && (
        <Marker
          position={{ lat: workerLocation.latitude, lng: workerLocation.longitude }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: isInsideFence ? '#22c55e' : '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          }}
        />
      )}
    </GoogleMap>
  );
};
