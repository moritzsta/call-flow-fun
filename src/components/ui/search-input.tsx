import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isSearching?: boolean;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Suchen...',
  debounceMs = 300,
  isSearching = false,
  className,
}: SearchInputProps) => {
  // Lokaler State für sofortige UI-Reaktion
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync externer Value -> lokaler State (nur wenn von außen geändert und unterschiedlich)
  useEffect(() => {
    if (value !== localValue && !debounceTimerRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Debounced onChange
  const debouncedOnChange = useCallback(
    (newValue: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
        debounceTimerRef.current = null;
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue); // Sofortige UI-Aktualisierung
    debouncedOnChange(newValue); // Verzögerte Filter-Aktualisierung
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  // Cleanup Timer bei Unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className="pl-10 pr-10"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isSearching && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {localValue && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Suche löschen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
