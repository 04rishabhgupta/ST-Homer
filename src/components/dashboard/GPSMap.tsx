import { useCallback, useState, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  Circle,
  InfoWindow,
} from '@react-google-maps/api';
import { GPSLocation, Geofence } from '@/types/gps';
import { MAP_CONFIG } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';

interface GPSMapProps {
  locations: GPSLocation[];
  selectedDevice: string | null;
  history: GPSLocation[];
  showHistory: boolean;
  geofences: Geofence[];
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Classic teardrop pin shape SVG path
const PIN_PATH = "M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24S20.5 14.88 20.5 8.5C20.5 3.81 16.69 0 12 0ZM12 11.5C10.34 11.5 9 10.16 9 8.5C9 6.84 10.34 5.5 12 5.5C13.66 5.5 15 6.84 15 8.5C15 10.16 13.66 11.5 12 11.5Z";

export const GPSMap = ({
  locations,
  selectedDevice,
  history,
  showHistory,
  geofences,
}: GPSMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<{
    position: google.maps.LatLngLiteral;
    content: GPSLocation;
  } | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Group locations by device and get latest for each
  const deviceLocations = new Map<string, GPSLocation>();
  locations.forEach(loc => {
    const existing = deviceLocations.get(loc.device_id);
    if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
      deviceLocations.set(loc.device_id, loc);
    }
  });

  const latestLocations = Array.from(deviceLocations.values());

  // History path for selected device
  const historyPath = showHistory && selectedDevice
    ? history
        .filter(loc => loc.device_id === selectedDevice)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(loc => ({ lat: loc.latitude, lng: loc.longitude }))
    : [];

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Center on selected device
  useEffect(() => {
    if (map && selectedDevice) {
      const device = deviceLocations.get(selectedDevice);
      if (device) {
        map.panTo({ lat: device.latitude, lng: device.longitude });
      }
    }
  }, [map, selectedDevice, deviceLocations]);

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
      center={MAP_CONFIG.defaultCenter}
      zoom={MAP_CONFIG.defaultZoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      {/* Geofence circles */}
      {geofences.map(zone => (
        <Circle
          key={zone.id}
          center={zone.center}
          radius={zone.radius}
          options={{
            fillColor: zone.color,
            fillOpacity: 0.2,
            strokeColor: zone.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      ))}

      {/* History trail */}
      {historyPath.length > 1 && (
        <Polyline
          path={historyPath}
          options={{
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                },
                offset: '100%',
                repeat: '100px',
              },
            ],
          }}
        />
      )}

      {/* Device markers */}
      {latestLocations.map(location => (
        <Marker
          key={location.device_id}
          position={{ lat: location.latitude, lng: location.longitude }}
          title={location.device_id}
          icon={{
            path: PIN_PATH,
            scale: selectedDevice === location.device_id ? 1.8 : 1.4,
            fillColor: selectedDevice === location.device_id ? '#3b82f6' : '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1,
            anchor: new google.maps.Point(12, 24),
          }}
          onClick={() => setInfoWindow({
            position: { lat: location.latitude, lng: location.longitude },
            content: location,
          })}
        />
      ))}

      {/* Info Window */}
      {infoWindow && (
        <InfoWindow
          position={infoWindow.position}
          onCloseClick={() => setInfoWindow(null)}
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-sm mb-2">{infoWindow.content.device_id}</h3>
            <div className="text-xs space-y-1 text-gray-600">
              <p>
                <span className="font-medium">Position:</span>{' '}
                {infoWindow.content.latitude.toFixed(6)}, {infoWindow.content.longitude.toFixed(6)}
              </p>
              <p>
                <span className="font-medium">Accelerometer:</span>{' '}
                X: {infoWindow.content.ax.toFixed(2)}, 
                Y: {infoWindow.content.ay.toFixed(2)}, 
                Z: {infoWindow.content.az.toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Last Update:</span>{' '}
                {new Date(infoWindow.content.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};
