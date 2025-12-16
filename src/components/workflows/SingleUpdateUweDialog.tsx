import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { UweWorkflowConfig } from '@/types/workflow';

interface SingleUpdateUweDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (config: UweWorkflowConfig) => void;
  isStarting: boolean;
  emailsCount: number;
}

export function SingleUpdateUweDialog({
  open,
  onOpenChange,
  onStart,
  isStarting,
  emailsCount,
}: SingleUpdateUweDialogProps) {
  const [userGoal, setUserGoal] = useState('');

  const handleStart = () => {
    if (!userGoal.trim()) return;
    onStart({ userGoal: userGoal.trim() });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setUserGoal('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-teal-500/20 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            Update Uwe
          </DialogTitle>
          <DialogDescription>
            Alle E-Mails im Projekt mit einem neuen Ziel überarbeiten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Achtung: Alle E-Mails werden überschrieben!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
            </div>
          </div>

          {/* Email count */}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{emailsCount}</strong> E-Mail{emailsCount !== 1 ? 's' : ''} werden überarbeitet
            </p>
          </div>

          {/* User Goal Input */}
          <div className="space-y-2">
            <Label htmlFor="userGoal">Ziel der Überarbeitung</Label>
            <Textarea
              id="userGoal"
              placeholder="z.B. Mache alle E-Mails kürzer und professioneller, fokussiere auf den Mehrwert für den Kunden..."
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Beschreibe, wie die E-Mails angepasst werden sollen.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isStarting}>
            Abbrechen
          </Button>
          <Button
            onClick={handleStart}
            disabled={isStarting || emailsCount === 0 || !userGoal.trim()}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isStarting ? 'Wird gestartet...' : `${emailsCount} E-Mails updaten`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
