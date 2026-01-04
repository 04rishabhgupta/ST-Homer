import { useState } from 'react';
import { PolygonFence } from '@/types/gps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit2, MapPin, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FencePanelProps {
  fences: PolygonFence[];
  onAddFence: (fence: Omit<PolygonFence, 'id'>) => void;
  onRemoveFence: (id: string) => void;
  onUpdateFence: (id: string, updates: Partial<PolygonFence>) => void;
  isDrawing: boolean;
  onToggleDrawing: () => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const FencePanel = ({
  fences,
  onAddFence,
  onRemoveFence,
  onUpdateFence,
  isDrawing,
  onToggleDrawing,
}: FencePanelProps) => {
  const [newFence, setNewFence] = useState({
    name: '',
    shiftStart: '09:00',
    shiftEnd: '17:00',
    color: COLORS[0],
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number }[] | null>(null);

  const handleSaveFence = () => {
    if (!newFence.name.trim()) return;

    // Use default coordinates if no drawing
    const coords = pendingCoords || [
      { lat: 28.5455, lng: 77.1920 },
      { lat: 28.5460, lng: 77.1930 },
      { lat: 28.5450, lng: 77.1935 },
      { lat: 28.5445, lng: 77.1925 },
    ];

    onAddFence({
      name: newFence.name,
      coordinates: coords,
      color: newFence.color,
      shiftStart: newFence.shiftStart,
      shiftEnd: newFence.shiftEnd,
    });

    setNewFence({ name: '', shiftStart: '09:00', shiftEnd: '17:00', color: COLORS[0] });
    setPendingCoords(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Button
          variant={isDrawing ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleDrawing}
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {isDrawing ? 'Drawing...' : 'Draw Fence'}
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Fence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
      </div>

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
