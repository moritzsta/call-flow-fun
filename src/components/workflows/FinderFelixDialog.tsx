import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkflowTrigger } from '@/hooks/useWorkflowTrigger';
import { useAuth } from '@/contexts/AuthContext';
import { Search } from 'lucide-react';

const finderFelixSchema = z.object({
  userInput: z
    .string()
    .trim()
    .min(10, 'Bitte geben Sie mindestens 10 Zeichen ein')
    .max(500, 'Maximal 500 Zeichen erlaubt'),
  state: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
});

type FinderFelixFormData = z.infer<typeof finderFelixSchema>;

interface FinderFelixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const FinderFelixDialog = ({
  open,
  onOpenChange,
  projectId,
}: FinderFelixDialogProps) => {
  const { user } = useAuth();
  const { triggerWorkflow, isTriggering } = useWorkflowTrigger();
  const [selectedState, setSelectedState] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FinderFelixFormData>({
    resolver: zodResolver(finderFelixSchema),
    defaultValues: {
      userInput: '',
      state: '',
      city: '',
      district: '',
    },
  });

  const onSubmit = (data: FinderFelixFormData) => {
    if (!user) return;

    triggerWorkflow(
      {
        workflowName: 'finder_felix',
        projectId,
        userId: user.id,
        triggerData: {
          user_input: data.userInput,
          state: data.state || null,
          city: data.city || null,
          district: data.district || null,
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!isTriggering) {
      reset();
      onOpenChange(false);
    }
  };

  // German states for demo
  const germanStates = [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen',
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Finder Felix: Firmen suchen
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie, welche Firmen Sie suchen möchten. Felix durchsucht die
            Datenbank nach passenden Unternehmen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User Input */}
          <div className="space-y-2">
            <Label htmlFor="userInput">
              Suchanfrage* 
              <span className="text-xs text-muted-foreground ml-2">
                (z.B. "Solartechnik-Firmen in Berlin")
              </span>
            </Label>
            <Textarea
              id="userInput"
              {...register('userInput')}
              placeholder="Beschreiben Sie Ihre Suche..."
              rows={4}
              disabled={isTriggering}
            />
            {errors.userInput && (
              <p className="text-sm text-destructive">{errors.userInput.message}</p>
            )}
          </div>

          {/* Optional Filters */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Optional: Filteroptionen</p>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">Bundesland</Label>
              <Select
                value={selectedState}
                onValueChange={setSelectedState}
                disabled={isTriggering}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Alle Bundesländer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Bundesländer</SelectItem>
                  {germanStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Stadt (optional)</Label>
              <input
                id="city"
                type="text"
                {...register('city')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="z.B. München, Hamburg"
                disabled={isTriggering}
              />
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label htmlFor="district">Bezirk (optional)</Label>
              <input
                id="district"
                type="text"
                {...register('district')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="z.B. Mitte, Altona"
                disabled={isTriggering}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isTriggering}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isTriggering}>
              {isTriggering ? 'Starte Suche...' : 'Suche starten'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
