
# Plan: E-Mail Badge-Zählungen im Projektdashboard korrigieren

## Problem
Die Badges "Entwürfe", "Verbessert" und "Versendet" in der E-Mail-Kachel zeigen maximal 50 an, obwohl es 83 E-Mails gibt. Das liegt daran, dass:
- Die Gesamtzahl (`totalEmails`) korrekt aus `totalCount` des Hooks kommt
- Die einzelnen Status-Zählungen (`draftEmails`, `sentEmails`, `improvedEmails`) jedoch aus `emails.filter(...)` berechnet werden
- Der `emails` Array enthält nur die erste Seite (50 Einträge) aufgrund der Standard-Pagination

## Lösung
Analog zu den Companies (Zeile 116: `pageSize: 1000`) eine höhere `pageSize` für die E-Mail-Abfrage im Dashboard setzen.

## Änderung

**Datei: `src/pages/ProjectDashboard.tsx`**

Zeile 124-128 ändern von:
```typescript
const { emails, totalCount: totalEmails, isLoading: emailsLoading } = useEmails(
  id || '',
  undefined,
  undefined
);
```

zu:
```typescript
const { emails, totalCount: totalEmails, isLoading: emailsLoading } = useEmails(
  id || '',
  undefined,
  undefined,
  { page: 0, pageSize: 1000 }
);
```

## Ergebnis
Alle E-Mail-Badges (Entwürfe, Verbessert, Versendet) zeigen dann die korrekten Zahlen basierend auf allen E-Mails des Projekts.
