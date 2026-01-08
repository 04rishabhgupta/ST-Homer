import { useState } from 'react';
import { PolygonFence } from '@/types/gps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Clock, Square, PenTool, Type, X } from 'lucide-react';

export type DrawingMode = 'none' | 'polygon' | 'rectangle';

interface FencePanelProps {
  fences: PolygonFence[];
  onAddFence: (fence: Omit<PolygonFence, 'id'>) => void;
  onRemoveFence: (id: string) => void;
  onUpdateFence: (id: string, updates: Partial<PolygonFence>) => void;
  drawingMode: DrawingMode;
  onSetDrawingMode: (mode: DrawingMode) => void;
  pendingCoords: { lat: number; lng: number }[] | null;
  onClearPendingCoords: () => void;
  isCreating: boolean;
  onSetIsCreating: (creating: boolean) => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const FencePanel = ({
  fences,
  onAddFence,
  onRemoveFence,
  onUpdateFence,
  drawingMode,
  onSetDrawingMode,
  pendingCoords,
  onClearPendingCoords,
  isCreating,
  onSetIsCreating,
}: FencePanelProps) => {
  const [newFence, setNewFence] = useState({
    name: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    color: COLORS[0],
  });
  const [createMethod, setCreateMethod] = useState<'draw' | 'rectangle' | 'coordinates'>('rectangle');
  
  // Manual coordinate inputs
  const [manualCoords, setManualCoords] = useState([
    { lat: '', lng: '' },
    { lat: '', lng: '' },
    { lat: '', lng: '' },
    { lat: '', lng: '' },
  ]);

  const handleStartCreating = () => {
    onSetIsCreating(true);
    setCreateMethod('rectangle');
    onSetDrawingMode('rectangle');
    setNewFence({ name: '', shiftStart: '09:00', shiftEnd: '17:00', color: COLORS[0] });
    setManualCoords([
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' },
    ]);
  };

  const handleCancelCreating = () => {
    onSetIsCreating(false);
    onSetDrawingMode('none');
    onClearPendingCoords();
  };

  const handleSaveFence = () => {
    if (!newFence.name.trim()) return;

    let coords: { lat: number; lng: number }[];

    if (createMethod === 'coordinates') {
      const validCoords = manualCoords
        .filter(c => c.lat && c.lng)
        .map(c => ({
          lat: parseFloat(c.lat),
          lng: parseFloat(c.lng),
        }))
        .filter(c => !isNaN(c.lat) && !isNaN(c.lng));

      if (validCoords.length < 3) {
        alert('Please enter at least 3 valid coordinates');
        return;
      }
      coords = validCoords;
    } else if (pendingCoords && pendingCoords.length >= 3) {
      coords = pendingCoords;
    } else {
      alert('Please draw a task area on the map first');
      return;
    }

    onAddFence({
      name: newFence.name,
      coordinates: coords,
      color: newFence.color,
      shiftStart: newFence.shiftStart,
      shiftEnd: newFence.shiftEnd,
    });

    handleCancelCreating();
  };

  const handleMethodChange = (method: 'draw' | 'rectangle' | 'coordinates') => {
    setCreateMethod(method);
    onClearPendingCoords();
    if (method === 'draw') {
      onSetDrawingMode('polygon');
    } else if (method === 'rectangle') {
      onSetDrawingMode('rectangle');
    } else {
      onSetDrawingMode('none');
    }
  };

  const addCoordinateRow = () => {
    setManualCoords([...manualCoords, { lat: '', lng: '' }]);
  };

  const updateCoordinate = (index: number, field: 'lat' | 'lng', value: string) => {
    const updated = [...manualCoords];
    updated[index][field] = value;
    setManualCoords(updated);
  };

  const removeCoordinateRow = (index: number) => {
    if (manualCoords.length > 3) {
      setManualCoords(manualCoords.filter((_, i) => i !== index));
    }
  };

  if (isCreating) {
    return null; // Content is rendered in the side panel in ManagerDashboard
  }

  return (
    <div className="p-4 space-y-4">
      <Button
        onClick={handleStartCreating}
        className="w-full"
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Task Area
      </Button>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2">
          {fences.map(fence => (
            <Card key={fence.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: fence.color }}
                    />
                    <span className="font-medium text-sm">{fence.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemoveFence(fence.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {fence.shiftStart} - {fence.shiftEnd}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {fence.coordinates.length} points
                </div>
              </CardContent>
            </Card>
          ))}

          {fences.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No task areas created yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Separate component for the creation panel
interface FenceCreationPanelProps {
  onClose: () => void;
  onSave: (fence: Omit<PolygonFence, 'id'>) => void;
  drawingMode: DrawingMode;
  onSetDrawingMode: (mode: DrawingMode) => void;
  pendingCoords: { lat: number; lng: number }[] | null;
  onClearPendingCoords: () => void;
}

export const FenceCreationPanel = ({
  onClose,
  onSave,
  drawingMode,
  onSetDrawingMode,
  pendingCoords,
  onClearPendingCoords,
}: FenceCreationPanelProps) => {
  const [newFence, setNewFence] = useState({
    name: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    color: COLORS[0],
  });
  const [createMethod, setCreateMethod] = useState<'draw' | 'rectangle' | 'coordinates'>('rectangle');
  const [manualCoords, setManualCoords] = useState([
    { lat: '', lng: '' },
    { lat: '', lng: '' },
    { lat: '', lng: '' },
    { lat: '', lng: '' },
  ]);

  const handleMethodChange = (method: 'draw' | 'rectangle' | 'coordinates') => {
    setCreateMethod(method);
    onClearPendingCoords();
    if (method === 'draw') {
      onSetDrawingMode('polygon');
    } else if (method === 'rectangle') {
      onSetDrawingMode('rectangle');
    } else {
      onSetDrawingMode('none');
    }
  };

  const handleSave = () => {
    if (!newFence.name.trim()) return;

    let coords: { lat: number; lng: number }[];

    if (createMethod === 'coordinates') {
      const validCoords = manualCoords
        .filter(c => c.lat && c.lng)
        .map(c => ({
          lat: parseFloat(c.lat),
          lng: parseFloat(c.lng),
        }))
        .filter(c => !isNaN(c.lat) && !isNaN(c.lng));

      if (validCoords.length < 3) {
        alert('Please enter at least 3 valid coordinates');
        return;
      }
      coords = validCoords;
    } else if (pendingCoords && pendingCoords.length >= 3) {
      coords = pendingCoords;
    } else {
      alert('Please draw a task area on the map first');
      return;
    }

    onSave({
      name: newFence.name,
      coordinates: coords,
      color: newFence.color,
      shiftStart: newFence.shiftStart,
      shiftEnd: newFence.shiftEnd,
    });
  };

  const addCoordinateRow = () => {
    setManualCoords([...manualCoords, { lat: '', lng: '' }]);
  };

  const updateCoordinate = (index: number, field: 'lat' | 'lng', value: string) => {
    const updated = [...manualCoords];
    updated[index][field] = value;
    setManualCoords(updated);
  };

  const removeCoordinateRow = (index: number) => {
    if (manualCoords.length > 3) {
      setManualCoords(manualCoords.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Create Task Area</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Tabs value={createMethod} onValueChange={(v) => handleMethodChange(v as 'draw' | 'rectangle' | 'coordinates')}>
          <TabsList className="w-full">
            <TabsTrigger value="rectangle" className="flex-1 gap-1 text-xs">
              <Square className="h-3 w-3" />
              Rectangle
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex-1 gap-1 text-xs">
              <PenTool className="h-3 w-3" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="coordinates" className="flex-1 gap-1 text-xs">
              <Type className="h-3 w-3" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rectangle" className="space-y-3 mt-3">
            <div className="p-3 bg-muted rounded-md text-xs">
              <p className="font-medium mb-1">Draw a rectangle</p>
              <p className="text-muted-foreground">
                Click and drag on the map. Resize using corner handles.
              </p>
            </div>
            {pendingCoords && pendingCoords.length > 0 && (
              <div className="p-2 bg-primary/10 rounded text-xs text-primary">
                ✓ Rectangle placed
              </div>
            )}
          </TabsContent>

          <TabsContent value="draw" className="space-y-3 mt-3">
            <div className="p-3 bg-muted rounded-md text-xs">
              <p className="font-medium mb-1">Draw a polygon</p>
              <p className="text-muted-foreground">
                Click to place points. Click first point to close.
              </p>
            </div>
            {pendingCoords && pendingCoords.length > 0 && (
              <div className="p-2 bg-primary/10 rounded text-xs text-primary">
                ✓ Shape drawn ({pendingCoords.length} points)
              </div>
            )}
          </TabsContent>

          <TabsContent value="coordinates" className="space-y-3 mt-3">
            <div className="p-3 bg-muted rounded-md text-xs">
              <p className="font-medium mb-1">Enter coordinates</p>
              <p className="text-muted-foreground">
                Minimum 3 points. Use decimal degrees.
              </p>
            </div>
            
            <div className="space-y-2">
              {manualCoords.map((coord, index) => (
                <div key={index} className="flex gap-1 items-center">
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  <Input
                    placeholder="Lat"
                    value={coord.lat}
                    onChange={(e) => updateCoordinate(index, 'lat', e.target.value)}
                    className="flex-1 h-7 text-xs"
                  />
                  <Input
                    placeholder="Lng"
                    value={coord.lng}
                    onChange={(e) => updateCoordinate(index, 'lng', e.target.value)}
                    className="flex-1 h-7 text-xs"
                  />
                  {manualCoords.length > 3 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeCoordinateRow(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addCoordinateRow} className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Add Point
            </Button>
          </TabsContent>
        </Tabs>

        <div className="space-y-3 pt-3 border-t">
          <div>
            <Label className="text-xs">Task Area Name</Label>
            <Input
              placeholder="e.g., Crane Zone A"
              value={newFence.name}
              onChange={(e) => setNewFence({ ...newFence, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Shift Start</Label>
              <Input
                type="time"
                value={newFence.shiftStart}
                onChange={(e) => setNewFence({ ...newFence, shiftStart: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Shift End</Label>
              <Input
                type="time"
                value={newFence.shiftEnd}
                onChange={(e) => setNewFence({ ...newFence, shiftEnd: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 ${
                    newFence.color === color ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewFence({ ...newFence, color })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t">
        <Button onClick={handleSave} className="w-full">
          Save Task Area
        </Button>
      </div>
    </div>
  );
};
