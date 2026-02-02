

## Firmen-Bereinigungsdialog - Implementierungsplan

### Zusammenfassung
Ich werde einen neuen "Firmen bereinigen"-Dialog erstellen, der über einen Button in der Firmenübersicht erreichbar ist. Der Dialog zeigt verschiedene Löschoptionen mit Vorschau an, wie viele Firmen betroffen wären.

### Architektur-Übersicht

```text
+----------------------------+
|    ProjectCompanies.tsx    |
|  +----------------------+  |
|  | "Bereinigen" Button  |  |
|  +----------+-----------+  |
|             |              |
+-------------|---------------+
              v
+----------------------------+
| CleanupCompaniesDialog.tsx |
|  - Löschoptionen anzeigen  |
|  - Vorschau der Anzahl     |
|  - Bestätigung             |
+----------------------------+
              |
              v
+----------------------------+
| cleanup-companies (Edge)   |
|  - Logik für Pattern-      |
|    basiertes Löschen       |
+----------------------------+
```

### Löschoptionen

1. **Ohne Website**: Firmen ohne eingetragene Website löschen
2. **Ohne E-Mail**: Firmen ohne eingetragene E-Mail-Adresse löschen
3. **Ohne Analyse**: Firmen die noch nicht analysiert wurden löschen
4. **Ähnliche Namen (Ketten)**: Erkennt Firmenketten mit ähnlichen Namen (z.B. "McFit Sindelfingen", "McFit Stuttgart") und behält nur eine pro Kette
5. **Ohne Telefonnummer**: Firmen ohne Telefonnummer löschen
6. **Nach Status**: Firmen mit bestimmtem Status löschen (z.B. "Abgelehnt")

### Zu erstellende/ändernde Dateien

#### 1. Neue Komponente: `src/components/companies/CleanupCompaniesDialog.tsx`
- Dialog mit Checkbox-Optionen für jede Lösch-Kategorie
- Live-Vorschau der betroffenen Firmen pro Option
- Visuell ansprechende Cards für jede Option mit Icon und Beschreibung
- "Vorschau"-Button zeigt Gesamtzahl der zu löschenden Firmen
- Bestätigungs-Dialog vor dem Löschen
- Loading-States während der Berechnung

#### 2. Neue Edge Function: `supabase/functions/cleanup-companies/index.ts`
- Zwei Modi: `preview` (zeigt nur Anzahl) und `delete` (führt Löschung durch)
- Parameter: `project_id`, `options` (welche Kriterien), `mode`
- Ketten-Erkennung: Extrahiert Basis-Firmennamen und gruppiert ähnliche
- Rückgabe: Anzahl der betroffenen/gelöschten Firmen pro Kategorie

#### 3. Änderung: `src/pages/ProjectCompanies.tsx`
- Neuen "Bereinigen"-Button hinzufügen (neben "Duplikate entfernen")
- Import und State für `CleanupCompaniesDialog`

#### 4. Änderung: `supabase/config.toml`
- Neue Edge Function `cleanup-companies` registrieren

---

### Technische Details

#### Ketten-Erkennung Algorithmus
Die Ketten-Erkennung funktioniert folgendermaßen:

1. Extrahiere den "Basis-Namen" jeder Firma:
   - Entferne Städtenamen (aus `city`-Feld)
   - Entferne typische Suffixe wie "GmbH", "AG", "e.K."
   - Normalisiere Whitespace

2. Gruppiere Firmen mit identischem Basis-Namen
3. Bei Gruppen mit mehr als einer Firma: Behalte die älteste (oder mit meisten Daten)

**Beispiel:**
- "McFit Sindelfingen" → Basis: "McFit"
- "McFit Stuttgart GmbH" → Basis: "McFit"
- Beide werden gruppiert, eine wird gelöscht

#### Edge Function Response

```typescript
interface CleanupResult {
  success: boolean;
  mode: 'preview' | 'delete';
  results: {
    no_website: { count: number; ids?: string[] };
    no_email: { count: number; ids?: string[] };
    no_analysis: { count: number; ids?: string[] };
    no_phone: { count: number; ids?: string[] };
    chains: { count: number; groups: { baseName: string; count: number }[] };
    by_status: { status: string; count: number }[];
  };
  total_affected: number;
}
```

#### Dialog UI-Struktur

```text
+-----------------------------------------------+
|  🧹 Firmen bereinigen                         |
|-----------------------------------------------|
|  Wählen Sie die Bereinigungsoptionen:         |
|                                               |
|  +------------------------------------------+ |
|  | ☐ Ohne Website                     [42]  | |
|  |   Entfernt Firmen ohne Website-Eintrag   | |
|  +------------------------------------------+ |
|  | ☐ Ohne E-Mail                      [28]  | |
|  |   Entfernt Firmen ohne E-Mail-Adresse    | |
|  +------------------------------------------+ |
|  | ☐ Ohne Analyse                     [15]  | |
|  |   Entfernt Firmen ohne KI-Analyse        | |
|  +------------------------------------------+ |
|  | ☐ Firmenketten (ähnliche Namen)    [8]   | |
|  |   Behält eine Firma pro Kette            | |
|  |   → McFit (3), Fitness First (2)...      | |
|  +------------------------------------------+ |
|  | ☐ Nach Status löschen                    | |
|  |   [Dropdown: Abgelehnt ▼]         [12]   | |
|  +------------------------------------------+ |
|                                               |
|  ⚠️ Gesamt: 95 Firmen werden gelöscht        |
|                                               |
|           [Abbrechen]  [Bereinigen starten]   |
+-----------------------------------------------+
```

---

### Implementierungsreihenfolge

1. **Edge Function erstellen** (`cleanup-companies`)
   - Basis-Logik für alle Löschoptionen
   - Preview- und Delete-Modus
   - Ketten-Erkennung implementieren

2. **Dialog-Komponente erstellen** (`CleanupCompaniesDialog`)
   - UI mit Checkboxen und Vorschau
   - API-Calls für Preview
   - Bestätigungs-Flow

3. **Integration in ProjectCompanies**
   - Button hinzufügen
   - Dialog einbinden
   - Refetch nach erfolgreicher Bereinigung

4. **Config aktualisieren**
   - Edge Function in `supabase/config.toml` registrieren

---

### Sicherheitsaspekte

- **Bestätigungs-Dialog**: Vor dem Löschen muss der Nutzer explizit bestätigen
- **RLS-Policies**: Nutzt bestehende `has_project_access()` Checks
- **Service Role**: Edge Function nutzt Service Role Key für Löschungen
- **Logging**: Alle Löschaktionen werden geloggt

