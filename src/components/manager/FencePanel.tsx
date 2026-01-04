import { useState } from 'react';
import { PolygonFence } from '@/types/gps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, MapPin, Clock, Square, PenTool, Type } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
}: FencePanelProps) => {
  const [newFence, setNewFence] = useState({
    name: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    color: COLORS[0],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createMethod, setCreateMethod] = useState<'draw' | 'rectangle' | 'coordinates'>('draw');
  
  // Manual coordinate inputs
  const [manualCoords, setManualCoords] = useState([
    { lat: '', lng: '' },
    { lat: '', lng: '' },
    { lat: '', lng: '' },
    { lat: '', lng: '' },
  ]);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setCreateMethod('draw');
    setManualCoords([
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' },
    ]);
  };

  const handleSaveFence = () => {
    if (!newFence.name.trim()) return;

    let coords: { lat: number; lng: number }[];

    if (createMethod === 'coordinates') {
      // Parse manual coordinates
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
      alert('Please draw a fence on the map first');
      return;
    }

    onAddFence({
      name: newFence.name,
      coordinates: coords,
      color: newFence.color,
      shiftStart: newFence.shiftStart,
      shiftEnd: newFence.shiftEnd,
    });

    setNewFence({ name: '', shiftStart: '09:00', shiftEnd: '17:00', color: COLORS[0] });
    onClearPendingCoords();
    onSetDrawingMode('none');
    setIsDialogOpen(false);
  };

  const handleStartDrawing = (mode: 'polygon' | 'rectangle') => {
    setCreateMethod(mode === 'polygon' ? 'draw' : 'rectangle');
    onSetDrawingMode(mode);
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
    <div className="p-4 space-y-4">
      <Button
        onClick={handleOpenDialog}
        className="w-full"
        size="sm"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Fence
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          onSetDrawingMode('none');
          onClearPendingCoords();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Fence</DialogTitle>
          </DialogHeader>
          
          <Tabs value={createMethod} onValueChange={(v) => {
            setCreateMethod(v as 'draw' | 'rectangle' | 'coordinates');
            if (v === 'draw') {
              onSetDrawingMode('polygon');
            } else if (v === 'rectangle') {
              onSetDrawingMode('rectangle');
            } else {
              onSetDrawingMode('none');
            }
          }}>
            <TabsList className="w-full">
              <TabsTrigger value="draw" className="flex-1 gap-1">
                <PenTool className="h-3 w-3" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="rectangle" className="flex-1 gap-1">
                <Square className="h-3 w-3" />
                Rectangle
              </TabsTrigger>
              <TabsTrigger value="coordinates" className="flex-1 gap-1">
                <Type className="h-3 w-3" />
                Coordinates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-4">
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium mb-1">Draw a polygon on the map</p>
                <p className="text-muted-foreground text-xs">
                  Click on the map to place points. Click the first point again to complete the shape.
                </p>
              </div>
              {pendingCoords && pendingCoords.length > 0 && (
                <div className="p-2 bg-primary/10 rounded text-xs">
                  ✓ Shape drawn with {pendingCoords.length} points
                </div>
              )}
            </TabsContent>

            <TabsContent value="rectangle" className="space-y-4">
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium mb-1">Draw a rectangle on the map</p>
                <p className="text-muted-foreground text-xs">
                  Click and drag to create a rectangle. You can resize it using the corner handles.
                </p>
              </div>
              {pendingCoords && pendingCoords.length > 0 && (
                <div className="p-2 bg-primary/10 rounded text-xs">
                  ✓ Rectangle placed with {pendingCoords.length} corners
                </div>
              )}
            </TabsContent>

            <TabsContent value="coordinates" className="space-y-4">
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium mb-1">Enter exact coordinates</p>
                <p className="text-muted-foreground text-xs">
                  Minimum 3 points required. Format: decimal degrees (e.g., 28.5450)
                </p>
              </div>
              
              <ScrollArea className="h-40">
                <div className="space-y-2 pr-2">
                  {manualCoords.map((coord, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                      <Input
                        placeholder="Latitude"
                        value={coord.lat}
                        onChange={(e) => updateCoordinate(index, 'lat', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                      <Input
                        placeholder="Longitude"
                        value={coord.lng}
                        onChange={(e) => updateCoordinate(index, 'lng', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                      {manualCoords.length > 3 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeCoordinateRow(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button variant="outline" size="sm" onClick={addCoordinateRow}>
                <Plus className="h-3 w-3 mr-1" />
                Add Point
              </Button>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 pt-2 border-t">
            <div>
              <Label>Fence Name</Label>
              <Input
                placeholder="e.g., Crane Zone A"
                value={newFence.name}
                onChange={(e) => setNewFence({ ...newFence, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shift Start</Label>
                <Input
                  type="time"
                  value={newFence.shiftStart}
                  onChange={(e) => setNewFence({ ...newFence, shiftStart: e.target.value })}
                />
              </div>
              <div>
                <Label>Shift End</Label>
                <Input
                  type="time"
                  value={newFence.shiftEnd}
                  onChange={(e) => setNewFence({ ...newFence, shiftEnd: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newFence.color === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFence({ ...newFence, color })}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleSaveFence} className="w-full">
              Save Fence
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              No fences created yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
