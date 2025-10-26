import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback = ({
  error,
  resetError,
  title = 'Etwas ist schiefgelaufen',
  message = 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.',
}: ErrorFallbackProps) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-1">{message}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Error Details (Development):</p>
              <p className="text-xs text-muted-foreground break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs font-semibold cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-muted-foreground mt-2 overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {resetError && (
              <Button onClick={resetError} className="flex-1">
                Erneut versuchen
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              Zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
