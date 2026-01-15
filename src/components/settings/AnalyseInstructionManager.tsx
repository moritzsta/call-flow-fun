import { useState } from 'react';
import { useAnalyseInstructions, AnalyseInstruction } from '@/hooks/useAnalyseInstructions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Save, Trash2, BarChart3 } from 'lucide-react';

export function AnalyseInstructionManager() {
  const { instructions, isLoading, createInstruction, updateInstruction, deleteInstruction } = useAnalyseInstructions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [instruction, setInstruction] = useState('');

  const selectedInstruction = instructions.find((i) => i.id === selectedId);

  const handleSelect = (id: string) => {
    const instr = instructions.find((i) => i.id === id);
    if (instr) {
      setSelectedId(id);
      setName(instr.name);
      setInstruction(instr.instruction);
      setIsCreating(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setName('');
    setInstruction('');
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !instruction.trim()) return;

    if (isCreating) {
      await createInstruction.mutateAsync({ name: name.trim(), instruction: instruction.trim() });
      setIsCreating(false);
      setName('');
      setInstruction('');
    } else if (selectedId) {
      await updateInstruction.mutateAsync({ id: selectedId, name: name.trim(), instruction: instruction.trim() });
    }
  };

  const handleDelete = async () => {
    if (selectedId) {
      await deleteInstruction.mutateAsync(selectedId);
      setSelectedId(null);
      setName('');
      setInstruction('');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analyse-Anweisungen verwalten
        </CardTitle>
        <CardDescription>
          Erstellen und bearbeiten Sie Anweisungen für die Firmenanalyse durch Analyse Anna.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instruction Selection */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="instruction-select">Anweisung auswählen</Label>
            <Select
              value={selectedId || ''}
              onValueChange={handleSelect}
            >
              <SelectTrigger id="instruction-select">
                <SelectValue placeholder="Anweisung auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {instructions.map((instr) => (
                  <SelectItem key={instr.id} value={instr.id}>
                    {instr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Anweisung
          </Button>
        </div>

        {/* Edit Form */}
        {(selectedId || isCreating) && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="instruction-name">Name *</Label>
              <Input
                id="instruction-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Wärmepumpen-Analyse"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instruction-text">Analyse-Anweisung *</Label>
              <Textarea
                id="instruction-text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Beschreiben Sie, welche Informationen auf der Firmenwebseite analysiert werden sollen..."
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Diese Anweisung wird an den Analyse-Workflow übergeben und bestimmt, nach welchen Kriterien Firmenwebseiten analysiert werden.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              {selectedId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Anweisung löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Die Analyse-Anweisung "{name}" wird dauerhaft gelöscht.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button 
                onClick={handleSave}
                disabled={!name.trim() || !instruction.trim() || createInstruction.isPending || updateInstruction.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createInstruction.isPending || updateInstruction.isPending ? 'Speichere...' : 'Speichern'}
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedId && !isCreating && instructions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Analyse-Anweisungen vorhanden.</p>
            <p className="text-sm">Erstellen Sie Ihre erste Anweisung mit dem Button oben.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
