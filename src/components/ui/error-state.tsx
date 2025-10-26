import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({
  title = 'Fehler beim Laden',
  message = 'Die Daten konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
  onRetry,
  className = '',
}: ErrorStateProps) => {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const ErrorStateCard = ({
  title,
  message,
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title || 'Fehler beim Laden'}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {message || 'Die Daten konnten nicht geladen werden.'}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Erneut versuchen
          </Button>
        )}
      </div>
    </div>
  );
};
