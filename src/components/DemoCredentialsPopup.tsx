import { useState } from 'react';
import { Info, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEMO_CREDENTIALS } from '@/contexts/AuthContext';

export const DemoCredentialsPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Info className="h-4 w-4" />
        Demo Credentials
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-card border rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold mb-4">Demo Login Credentials</h2>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-primary">Manager Account</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-2 py-1 rounded">
                        {DEMO_CREDENTIALS.manager.email}
                      </code>
                      <button
                        onClick={() => copyToClipboard(DEMO_CREDENTIALS.manager.email, 'manager-email')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied === 'manager-email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-2 py-1 rounded">
                        {DEMO_CREDENTIALS.manager.password}
                      </code>
                      <button
                        onClick={() => copyToClipboard(DEMO_CREDENTIALS.manager.password, 'manager-pass')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied === 'manager-pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-primary">Worker Account</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-2 py-1 rounded">
                        {DEMO_CREDENTIALS.worker.email}
                      </code>
                      <button
                        onClick={() => copyToClipboard(DEMO_CREDENTIALS.worker.email, 'worker-email')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied === 'worker-email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-2 py-1 rounded">
                        {DEMO_CREDENTIALS.worker.password}
                      </code>
                      <button
                        onClick={() => copyToClipboard(DEMO_CREDENTIALS.worker.password, 'worker-pass')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied === 'worker-pass' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Managers can create fences and assign workers. Workers can only view their assigned fence and location.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
