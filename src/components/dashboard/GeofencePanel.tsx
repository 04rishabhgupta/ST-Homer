import { useState } from 'react';
import { Circle, Plus, Trash2, Edit2 } from 'lucide-react';
import { Geofence } from '@/types/gps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GeofencePanelProps {
  geofences: Geofence[];
  onAddGeofence: (geofence: Omit<Geofence, 'id'>) => void;
  onRemoveGeofence: (id: string) => void;
  onUpdateGeofence: (id: string, updates: Partial<Geofence>) => void;
}

export const GeofencePanel = ({
  geofences,
  onAddGeofence,
  onRemoveGeofence,
}: GeofencePanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    lat: '',
    lng: '',
    radius: '100',
    color: '#22c55e',
  });

  const handleAdd = () => {
    if (!newGeofence.name || !newGeofence.lat || !newGeofence.lng) return;
    
    onAddGeofence({
      name: newGeofence.name,
      center: {
        lat: parseFloat(newGeofence.lat),
        lng: parseFloat(newGeofence.lng),
      },
      radius: parseFloat(newGeofence.radius),
      color: newGeofence.color,
    });
    
    setNewGeofence({
      name: '',
      lat: '',
      lng: '',
      radius: '100',
      color: '#22c55e',
    });
    setIsOpen(false);
  };

  const colorOptions = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Geofence Zones</h2>
          <p className="text-sm text-muted-foreground">{geofences.length} zones</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Geofence Zone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Zone Name</Label>
                <Input
                  id="name"
                  value={newGeofence.name}
                  onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
                  placeholder="e.g., Main Building"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={newGeofence.lat}
                    onChange={(e) => setNewGeofence({ ...newGeofence, lat: e.target.value })}
                    placeholder="28.5450"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={newGeofence.lng}
                    onChange={(e) => setNewGeofence({ ...newGeofence, lng: e.target.value })}
                    placeholder="77.1926"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="radius">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={newGeofence.radius}
                  onChange={(e) => setNewGeofence({ ...newGeofence, radius: e.target.value })}
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newGeofence.color === color ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewGeofence({ ...newGeofence, color })}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleAdd} className="w-full">
                Add Zone
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {geofences.map(zone => (
            <Card key={zone.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Circle
                    className="h-4 w-4"
                    style={{ color: zone.color, fill: zone.color }}
                  />
                  <span className="font-medium text-sm">{zone.name}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => onRemoveGeofence(zone.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Center: {zone.center.lat.toFixed(4)}, {zone.center.lng.toFixed(4)}</p>
                <p>Radius: {zone.radius}m</p>
              </div>
            </Card>
          ))}

          {geofences.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No geofence zones defined
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
