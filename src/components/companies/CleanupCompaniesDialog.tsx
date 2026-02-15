import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  Globe,
  Mail,
  Phone,
  Brain,
  Link2,
  Tag,
  AlertTriangle,
  Loader2,
  Sparkles,
  Type,
  CheckCircle2,
} from 'lucide-react';

interface CleanupOptions {
  no_website: boolean;
  no_email: boolean;
  no_analysis: boolean;
  no_phone: boolean;
  chains: boolean;
  by_status: string | null;
  fix_names: boolean;
}

interface FixedName {
  id: string;
  before: string;
  after: string;
}

interface ChainGroup {
  baseName: string;
  count: number;
}

interface CleanupResult {
  success: boolean;
  mode: 'preview' | 'delete';
  results: {
    no_website: { count: number };
    no_email: { count: number };
    no_analysis: { count: number };
    no_phone: { count: number };
    chains: { count: number; groups: ChainGroup[] };
    by_status: { status: string; count: number }[];
    fix_names: { count: number; fixed: FixedName[] };
  };
  total_affected: number;
}

interface CleanupCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'found', label: 'Gefunden' },
  { value: 'analyzed', label: 'Analysiert' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'qualified', label: 'Qualifiziert' },
  { value: 'rejected', label: 'Abgelehnt' },
];

export function CleanupCompaniesDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: CleanupCompaniesDialogProps) {
  const [options, setOptions] = useState<CleanupOptions>({
    no_website: false,
    no_email: false,
    no_analysis: false,
    no_phone: false,
    chains: false,
    by_status: null,
    fix_names: false,
  });
  
  const [previewResult, setPreviewResult] = useState<CleanupResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFixingNames, setIsFixingNames] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Auto-fetch preview when options change
  useEffect(() => {
    if (!open) return;
    
    const hasAnyOption = 
      options.no_website || 
      options.no_email || 
      options.no_analysis || 
      options.no_phone || 
      options.chains || 
      options.by_status !== null ||
      options.fix_names;
    
    if (!hasAnyOption) {
      setPreviewResult(null);
      return;
    }

    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const { data, error } = await supabase.functions.invoke('cleanup-companies', {
          body: {
            project_id: projectId,
            options,
            mode: 'preview',
          },
        });

        if (error) throw error;
        setPreviewResult(data as CleanupResult);
      } catch (error) {
        console.error('Preview error:', error);
        toast.error('Fehler beim Laden der Vorschau');
      } finally {
        setIsLoadingPreview(false);
      }
    };

    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [open, options, projectId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-companies', {
        body: {
          project_id: projectId,
          options,
          mode: 'delete',
        },
      });

      if (error) throw error;
      
      const result = data as CleanupResult;
      const messages: string[] = [];
      if (result.total_affected > 0) {
        messages.push(`${result.total_affected} Firmen gelöscht`);
      }
      if (result.results.fix_names?.count > 0) {
        messages.push(`${result.results.fix_names.count} Namen korrigiert`);
      }
      toast.success(messages.join(', ') || 'Bereinigung abgeschlossen');
      setShowConfirmDialog(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Bereinigen der Firmen');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFixNamesOnly = async () => {
    setIsFixingNames(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-companies', {
        body: {
          project_id: projectId,
          options: { ...options, fix_names: true },
          mode: 'delete',
        },
      });

      if (error) throw error;
      
      const result = data as CleanupResult;
      toast.success(`${result.results.fix_names?.count || 0} Firmennamen korrigiert`);
      onSuccess();
    } catch (error) {
      console.error('Fix names error:', error);
      toast.error('Fehler beim Korrigieren der Namen');
    } finally {
      setIsFixingNames(false);
    }
  };

  const handleClose = () => {
    setOptions({
      no_website: false,
      no_email: false,
      no_analysis: false,
      no_phone: false,
      chains: false,
      by_status: null,
      fix_names: false,
    });
    setPreviewResult(null);
    onOpenChange(false);
  };

  const toggleOption = (key: keyof Omit<CleanupOptions, 'by_status'>) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAnyDeleteSelection = 
    options.no_website || 
    options.no_email || 
    options.no_analysis || 
    options.no_phone || 
    options.chains || 
    options.by_status !== null;

  const hasAnySelection = hasAnyDeleteSelection || options.fix_names;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Firmen bereinigen
            </DialogTitle>
            <DialogDescription>
              Wählen Sie die Bereinigungsoptionen. Die Vorschau zeigt, wie viele Firmen betroffen wären.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* No Website */}
            <Card 
              className={`cursor-pointer transition-all ${options.no_website ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => toggleOption('no_website')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={options.no_website}
                  onCheckedChange={() => toggleOption('no_website')}
                  onClick={(e) => e.stopPropagation()}
                />
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-medium cursor-pointer">Ohne Website</Label>
                  <p className="text-sm text-muted-foreground">
                    Entfernt Firmen ohne Website-Eintrag
                  </p>
                </div>
                {isLoadingPreview ? (
                  <Skeleton className="h-6 w-12" />
                ) : previewResult && options.no_website ? (
                  <Badge variant="secondary">{previewResult.results.no_website.count}</Badge>
                ) : null}
              </CardContent>
            </Card>

            {/* No Email */}
            <Card 
              className={`cursor-pointer transition-all ${options.no_email ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => toggleOption('no_email')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={options.no_email}
                  onCheckedChange={() => toggleOption('no_email')}
                  onClick={(e) => e.stopPropagation()}
                />
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-medium cursor-pointer">Ohne E-Mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Entfernt Firmen ohne E-Mail-Adresse
                  </p>
                </div>
                {isLoadingPreview ? (
                  <Skeleton className="h-6 w-12" />
                ) : previewResult && options.no_email ? (
                  <Badge variant="secondary">{previewResult.results.no_email.count}</Badge>
                ) : null}
              </CardContent>
            </Card>

            {/* No Phone */}
            <Card 
              className={`cursor-pointer transition-all ${options.no_phone ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => toggleOption('no_phone')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={options.no_phone}
                  onCheckedChange={() => toggleOption('no_phone')}
                  onClick={(e) => e.stopPropagation()}
                />
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-medium cursor-pointer">Ohne Telefon</Label>
                  <p className="text-sm text-muted-foreground">
                    Entfernt Firmen ohne Telefonnummer
                  </p>
                </div>
                {isLoadingPreview ? (
                  <Skeleton className="h-6 w-12" />
                ) : previewResult && options.no_phone ? (
                  <Badge variant="secondary">{previewResult.results.no_phone.count}</Badge>
                ) : null}
              </CardContent>
            </Card>

            {/* No Analysis */}
            <Card 
              className={`cursor-pointer transition-all ${options.no_analysis ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => toggleOption('no_analysis')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={options.no_analysis}
                  onCheckedChange={() => toggleOption('no_analysis')}
                  onClick={(e) => e.stopPropagation()}
                />
                <Brain className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-medium cursor-pointer">Ohne Analyse</Label>
                  <p className="text-sm text-muted-foreground">
                    Entfernt Firmen ohne KI-Analyse
                  </p>
                </div>
                {isLoadingPreview ? (
                  <Skeleton className="h-6 w-12" />
                ) : previewResult && options.no_analysis ? (
                  <Badge variant="secondary">{previewResult.results.no_analysis.count}</Badge>
                ) : null}
              </CardContent>
            </Card>

            {/* Chains */}
            <Card 
              className={`cursor-pointer transition-all ${options.chains ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => toggleOption('chains')}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <Checkbox
                  checked={options.chains}
                  onCheckedChange={() => toggleOption('chains')}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <Link2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label className="font-medium cursor-pointer">Firmenketten (ähnliche Namen)</Label>
                  <p className="text-sm text-muted-foreground">
                    Erkennt Ketten wie "McFit Sindelfingen", "McFit Stuttgart" und behält nur eine pro Kette
                  </p>
                  {previewResult && options.chains && previewResult.results.chains.groups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {previewResult.results.chains.groups.slice(0, 5).map((group) => (
                        <Badge key={group.baseName} variant="outline" className="text-xs">
                          {group.baseName} ({group.count})
                        </Badge>
                      ))}
                      {previewResult.results.chains.groups.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{previewResult.results.chains.groups.length - 5} weitere
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {isLoadingPreview ? (
                  <Skeleton className="h-6 w-12" />
                ) : previewResult && options.chains ? (
                  <Badge variant="secondary">{previewResult.results.chains.count}</Badge>
                ) : null}
              </CardContent>
            </Card>

            {/* By Status */}
            <Card 
              className={`transition-all ${options.by_status ? 'border-primary bg-primary/5' : ''}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={options.by_status !== null}
                  onCheckedChange={(checked) => {
                    setOptions(prev => ({
                      ...prev,
                      by_status: checked ? 'rejected' : null,
                    }));
                  }}
                />
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="font-medium">Nach Status löschen</Label>
                  <p className="text-sm text-muted-foreground">
                    Entfernt Firmen mit bestimmtem Status
                  </p>
                </div>
                <Select
                  value={options.by_status || ''}
                  onValueChange={(value) => setOptions(prev => ({ ...prev, by_status: value || null }))}
                  disabled={options.by_status === null}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isLoadingPreview ? (
                  <Skeleton className="h-6 w-12" />
                ) : previewResult && options.by_status && previewResult.results.by_status.length > 0 ? (
                  <Badge variant="secondary">{previewResult.results.by_status[0].count}</Badge>
                ) : null}
              </CardContent>
            </Card>

            {/* Separator */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Korrektur (ohne Löschen)</span>
              </div>
            </div>

            {/* Fix Names */}
            <Card 
              className={`cursor-pointer transition-all ${options.fix_names ? 'border-green-500 bg-green-500/5' : ''}`}
              onClick={() => toggleOption('fix_names')}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <Checkbox
                  checked={options.fix_names}
                  onCheckedChange={() => toggleOption('fix_names')}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <Type className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label className="font-medium cursor-pointer">Namen korrigieren</Label>
                  <p className="text-sm text-muted-foreground">
                    Korrigiert Sonderzeichen in Firmennamen (z.B. &amp;amp; → &amp;)
                  </p>
                  {previewResult && options.fix_names && previewResult.results.fix_names?.fixed?.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs">
                      {previewResult.results.fix_names.fixed.slice(0, 3).map((fix) => (
                        <div key={fix.id} className="flex items-center gap-2 text-muted-foreground">
                          <span className="line-through">{fix.before}</span>
                          <span>→</span>
                          <span className="text-foreground font-medium">{fix.after}</span>
                        </div>
                      ))}
                      {previewResult.results.fix_names.fixed.length > 3 && (
                        <div className="text-muted-foreground">
                          +{previewResult.results.fix_names.fixed.length - 3} weitere...
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isLoadingPreview ? (
                  <Skeleton className="h-6 w-12" />
                ) : previewResult && options.fix_names ? (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    {previewResult.results.fix_names?.count || 0}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Total Summary */}
          {hasAnyDeleteSelection && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  {isLoadingPreview ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Berechne...
                    </span>
                  ) : previewResult ? (
                    `Gesamt: ${previewResult.total_affected} Firmen werden gelöscht`
                  ) : (
                    'Wählen Sie mindestens eine Option'
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Fix Names Summary */}
          {options.fix_names && !hasAnyDeleteSelection && previewResult && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  {isLoadingPreview ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Berechne...
                    </span>
                  ) : (
                    `${previewResult.results.fix_names?.count || 0} Firmennamen werden korrigiert`
                  )}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            {options.fix_names && !hasAnyDeleteSelection && (
              <Button
                variant="default"
                onClick={handleFixNamesOnly}
                disabled={isLoadingPreview || !previewResult || (previewResult.results.fix_names?.count || 0) === 0 || isFixingNames}
                className="bg-green-600 hover:bg-green-700"
              >
                {isFixingNames ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Korrigiere...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Namen korrigieren
                  </>
                )}
              </Button>
            )}
            {hasAnyDeleteSelection && (
              <Button
                variant="destructive"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isLoadingPreview || !previewResult || previewResult.total_affected === 0}
              >
                Bereinigen starten
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firmen endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sie sind dabei, <strong>{previewResult?.total_affected || 0} Firmen</strong> zu löschen.
              <br /><br />
              <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Löschen...
                </>
              ) : (
                'Ja, löschen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
