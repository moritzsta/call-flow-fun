

# Plan: E-Mail-Pagination Fix

## Problem

Der `useEmails` Hook hat ein Standard-Limit von 50 E-Mails (`pageSize: 50`). Da die ProjectEmails-Seite keine Pagination-UI implementiert und den `totalCount` nicht korrekt nutzt, werden nur 50 von 83 E-Mails angezeigt.

## Lösung

Zwei Optionen sind möglich:

### Option A: Pagination-UI hinzufügen (empfohlen für Performance)
Fügt Vor-/Zurück-Buttons und Seitenanzeige hinzu, um durch alle E-Mails zu blättern.

### Option B: Alle E-Mails laden (einfacher, aber weniger performant)
Erhöht das `pageSize` auf einen höheren Wert (z.B. 500 oder 1000), um alle E-Mails auf einmal zu laden.

**Empfehlung:** Option A mit Pagination, da die E-Mail-Liste mit der Zeit wachsen kann.

---

## Implementierung (Option A)

### 1. ProjectEmails.tsx anpassen

**Änderungen:**

```text
1. Pagination-State hinzufügen:
   - currentPage: number (default: 0)
   - pageSize: number (default: 50)

2. useEmails mit Pagination aufrufen:
   - pagination-Parameter übergeben

3. totalCount nutzen statt emails.length:
   - Header-Anzeige: "83 E-Mails gesamt" statt "50 E-Mails gesamt"
   - Test-Dialog Warnung aktualisieren

4. Pagination-UI hinzufügen:
   - Unterhalb der EmailsTable
   - "Vorherige" / "Nächste" Buttons
   - Anzeige: "Seite 1 von 2" bzw. "1-50 von 83"
```

### 2. UI-Elemente

```text
┌─────────────────────────────────────────────────────────┐
│ E-Mail-Liste                                            │
│ ... (Tabelle mit 50 Einträgen) ...                     │
├─────────────────────────────────────────────────────────┤
│ ◀ Vorherige │ Seite 1 von 2 │ Nächste ▶ │ 1-50 von 83  │
└─────────────────────────────────────────────────────────┘
```

---

## Dateien

| Aktion | Datei |
|--------|-------|
| ÄNDERN | `src/pages/ProjectEmails.tsx` |
| ÄNDERN | `src/components/emails/EmailStats.tsx` (optional: totalCount nutzen) |

---

## Technische Details

### State-Erweiterung
```typescript
const [pagination, setPagination] = useState<PaginationConfig>({
  page: 0,
  pageSize: 50
});
```

### Hook-Aufruf mit totalCount
```typescript
const {
  emails,
  totalCount,  // ← Jetzt genutzt!
  isLoading,
  ...
} = useEmails(id, filters, sortConfig, pagination);
```

### Pagination-Berechnung
```typescript
const totalPages = Math.ceil(totalCount / pagination.pageSize);
const from = pagination.page * pagination.pageSize + 1;
const to = Math.min((pagination.page + 1) * pagination.pageSize, totalCount);
```

### Header-Fix
```typescript
// Vorher (falsch):
<p>{emails.length} E-Mails gesamt</p>

// Nachher (korrekt):
<p>{totalCount} E-Mails gesamt</p>
```

---

## Vorteile

- ✅ Alle 83+ E-Mails sind zugänglich
- ✅ Bessere Performance bei großen Datensätzen
- ✅ Korrekte Gesamtzahl-Anzeige
- ✅ Skaliert für zukünftige Projekte mit vielen E-Mails

