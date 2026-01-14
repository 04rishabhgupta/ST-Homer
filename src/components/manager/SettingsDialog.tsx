import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ManagerSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { Clock, Monitor, MapPin, RotateCcw } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ManagerSettings;
  onSave: (settings: ManagerSettings) => void;
  onReset: () => void;
}

export const SettingsDialog = ({
  open,
  onOpenChange,
  settings,
  onSave,
  onReset,
}: SettingsDialogProps) => {
  const [localSettings, setLocalSettings] = useState<ManagerSettings>(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    onReset();
  };

  const updateLocal = (updates: Partial<ManagerSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Monitoring Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Device Monitoring
            </div>
            <Separator className="bg-border/50" />

            {/* Offline Timeout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Offline Timeout</Label>
                <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {localSettings.deviceTimeoutSeconds}s
                </span>
              </div>
              <Slider
                value={[localSettings.deviceTimeoutSeconds]}
                onValueChange={([value]) => updateLocal({ deviceTimeoutSeconds: value })}
                min={10}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10s</span>
                <span>60s</span>
              </div>
            </div>

            {/* Out-of-Zone Alert Delay */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Out-of-Zone Alert Delay</Label>
                <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {localSettings.outOfZoneAlertDelaySeconds}s
                </span>
              </div>
              <Slider
                value={[localSettings.outOfZoneAlertDelaySeconds]}
                onValueChange={([value]) => updateLocal({ outOfZoneAlertDelaySeconds: value })}
                min={10}
                max={120}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10s</span>
                <span>120s</span>
              </div>
            </div>
          </div>

          {/* Work Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Work Schedule
            </div>
            <Separator className="bg-border/50" />

            {/* Break Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Break Duration</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={localSettings.breakDurationValue}
                  onChange={(e) => updateLocal({ breakDurationValue: parseInt(e.target.value) || 1 })}
                  className="w-24 bg-background"
                />
                <Select
                  value={localSettings.breakDurationUnit}
                  onValueChange={(value: 'minutes' | 'hours') => updateLocal({ breakDurationUnit: value })}
                >
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">minute(s)</SelectItem>
                    <SelectItem value="hours">hour(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Display Preferences Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Display Preferences
            </div>
            <Separator className="bg-border/50" />

            {/* Auto-Refresh Interval */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Auto-Refresh Interval</Label>
                <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {localSettings.autoRefreshIntervalSeconds}s
                </span>
              </div>
              <Slider
                value={[localSettings.autoRefreshIntervalSeconds]}
                onValueChange={([value]) => updateLocal({ autoRefreshIntervalSeconds: value })}
                min={3}
                max={30}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3s</span>
                <span>30s</span>
              </div>
            </div>

            {/* Default Map Zoom */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Default Map Zoom</Label>
                <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {localSettings.defaultMapZoom}
                </span>
              </div>
              <Slider
                value={[localSettings.defaultMapZoom]}
                onValueChange={([value]) => updateLocal({ defaultMapZoom: value })}
                min={10}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 (far)</span>
                <span>20 (close)</span>
              </div>
            </div>

            {/* Show Offline Devices */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm font-medium">Show Offline Devices</Label>
              <Switch
                checked={localSettings.showOfflineDevices}
                onCheckedChange={(checked) => updateLocal({ showOfflineDevices: checked })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
