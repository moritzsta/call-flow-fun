import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalysisDisplayProps {
  analysis: any | null;
}

export const AnalysisDisplay = ({ analysis }: AnalysisDisplayProps) => {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analyse
          </CardTitle>
          <CardDescription>Diese Firma wurde noch nicht analysiert</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Starten Sie "Analyse Anna", um eine KI-gestützte Analyse dieser Firma zu erhalten.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Parse analysis data (assuming it's a JSON object with various fields)
  const renderAnalysisContent = () => {
    if (typeof analysis === 'string') {
      return <p className="whitespace-pre-wrap">{analysis}</p>;
    }

    if (typeof analysis === 'object' && analysis !== null) {
      return (
        <div className="space-y-4">
          {Object.entries(analysis).map(([key, value]) => {
            // Skip internal fields
            if (key.startsWith('_') || key === 'metadata') return null;

            return (
              <div key={key} className="space-y-2">
                <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                  {key.replace(/_/g, ' ')}
                </h4>
                {typeof value === 'object' && value !== null ? (
                  <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{String(value)}</p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return <p className="text-muted-foreground">Keine Analysedaten verfügbar</p>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Analyse-Ergebnisse
        </CardTitle>
        <CardDescription>KI-gestützte Analyse von Analyse Anna</CardDescription>
      </CardHeader>
      <CardContent>{renderAnalysisContent()}</CardContent>
    </Card>
  );
};
