import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnalyseInstructions } from '@/hooks/useAnalyseInstructions';

interface SingleAnalyseAnnaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (analyseInstructionId?: string, analyseInstruction?: string, analyseInstructionName?: string) => void;
  isStarting: boolean;
  companiesCount: number;
}

export const SingleAnalyseAnnaDialog = ({
  open,
  onOpenChange,
  onStart,
  isStarting,
  companiesCount,
}: SingleAnalyseAnnaDialogProps) => {
  const { instructions, isLoading } = useAnalyseInstructions();
  const [selectedInstructionId, setSelectedInstructionId] = useState<string>('');

  const handleStart = () => {
    const selectedInstruction = instructions.find(i => i.id === selectedInstructionId);
    onStart(selectedInstructionId, selectedInstruction?.instruction, selectedInstruction?.name);
  };

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Analyse Anna starten"
      description="Anna wird alle gefundenen Firmen mit Website analysieren"
    >
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anna wird <strong>{companiesCount} Firmen</strong> mit Website analysieren.
          </AlertDescription>
        </Alert>

        {companiesCount === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Keine Firmen zum Analysieren vorhanden. Bitte starten Sie zuerst Finder Felix.
            </AlertDescription>
          </Alert>
        )}

        {/* Analyse Instruction Selection */}
        <div className="space-y-2">
          <Label htmlFor="analyseInstruction">Analyse-Anweisung *</Label>
          <Select
            value={selectedInstructionId}
            onValueChange={setSelectedInstructionId}
            disabled={isStarting || isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Analyse-Anweisung auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {instructions.map((instruction) => (
                <SelectItem key={instruction.id} value={instruction.id}>
                  {instruction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Bestimmt, nach welchen Kriterien Firmenwebseiten analysiert werden
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleStart} 
            disabled={isStarting || companiesCount === 0 || !selectedInstructionId}
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gestartet...
              </>
            ) : (
              'Anna starten'
            )}
          </Button>
        </div>
      </div>
    </AdaptiveDialog>
  );
};
