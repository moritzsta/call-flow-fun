
# Plan: Verkäufer-Profile (Seller Profiles) Feature

## Übersicht

Dieses Feature erweitert die Einstellungen um einen neuen Tab "Verkäufer-Profile", in dem Benutzer ihre Verkäufer-/Kontaktdaten vorkonfigurieren können. Diese Profile können dann in den Workflow-Dialogen (SinglePitchPaulDialog, AutomationDialog) über ein Dropdown ausgewählt werden.

## Architektur

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Settings Page                               │
│  ┌──────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │Profil│ │Templates│ │ Analyse │ │ E-Mail  │ │ Verkäufer-   │  │
│  │      │ │         │ │Anweis.  │ │Anweis.  │ │ Profile  NEU │  │
│  └──────┘ └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              SellerProfileManager (CRUD)                         │
│  - Profil erstellen/bearbeiten/löschen                          │
│  - Felder: Name, Firma, Adresse, Telefon, Website               │
│  - Profilname zur Identifikation                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  SinglePitchPaulDialog / AutomationDialog                        │
│  ┌─────────────────────────────────┐                            │
│  │ Verkäufer-Profil: [Dropdown ▼]  │  ← "Kein Profil" | Profile │
│  │ ────────────────────────────────│                            │
│  │ Name:     [Auto-befüllt/edit]   │                            │
│  │ Firma:    [Auto-befüllt/edit]   │                            │
│  │ Adresse:  [Auto-befüllt/edit]   │                            │
│  │ Telefon:  [Auto-befüllt/edit]   │                            │
│  │ Website:  [Auto-befüllt/edit]   │                            │
│  └─────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Implementierungsschritte

### 1. Datenbank: Neue Tabelle `seller_profiles`

Neue Tabelle mit folgendem Schema (analog zu `email_instructions`):

| Spalte       | Typ                      | Beschreibung                    |
|--------------|--------------------------|----------------------------------|
| id           | uuid (PK, default)       | Primärschlüssel                 |
| profile_name | text NOT NULL            | Anzeigename des Profils         |
| name         | text NOT NULL            | Verkäufer-Name                  |
| company      | text NOT NULL            | Firmenname                      |
| address      | text                     | Adresse (optional)              |
| phone        | text                     | Telefon (optional)              |
| website      | text                     | Website-URL (optional)          |
| created_at   | timestamptz (default)    | Erstellungszeitpunkt            |
| updated_at   | timestamptz (default)    | Letzte Aktualisierung           |

**RLS-Policies**: Gleiche Struktur wie `email_instructions`:
- SELECT: Für alle authentifizierten Benutzer
- INSERT/UPDATE/DELETE: Für alle authentifizierten Benutzer

### 2. Hook: `useSellerProfiles.ts`

Neuer React Query Hook (Pattern von `useEmailInstructions.ts`):

```typescript
// Funktionen:
- instructions → profiles (Umbenennung)
- createInstruction → createProfile
- updateInstruction → updateProfile
- deleteInstruction → deleteProfile

// Interface:
interface SellerProfile {
  id: string;
  profile_name: string;
  name: string;
  company: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}
```

### 3. Settings-Komponente: `SellerProfileManager.tsx`

Neue Manager-Komponente (Pattern von `EmailInstructionManager.tsx`):

- Dropdown zur Profilauswahl
- "Neues Profil" Button
- Formular mit allen Verkäufer-Feldern
- Speichern/Löschen Buttons
- Leerer Zustand mit Icon

### 4. Settings-Seite erweitern

Änderungen an `src/pages/Settings.tsx`:
- Neuen Tab "Verkäufer-Profile" hinzufügen
- TabsList von 4 auf 5 Spalten erweitern
- Icon: `Building2` oder `UserCircle` von lucide-react
- SellerProfileManager importieren und rendern

### 5. SinglePitchPaulDialog anpassen

Änderungen an `src/components/workflows/SinglePitchPaulDialog.tsx`:

- `useSellerProfiles` Hook importieren
- Neues Dropdown "Verkäufer-Profil auswählen" oberhalb der Kontaktdaten
- Bei Auswahl: Alle Felder (sellerName, sellerCompany, etc.) automatisch befüllen
- Felder bleiben editierbar (Override möglich)
- Option "Manuell eingeben" für kein Profil

### 6. AutomationDialog anpassen

Änderungen an `src/components/automation/AutomationDialog.tsx`:

- `useSellerProfiles` Hook importieren
- Neues Dropdown in der "Verkäufer-Kontaktdaten" Card
- Bei Auswahl: Formularfelder automatisch befüllen
- handleFillTestData auch mit Profil-Logik aktualisieren

## Dateien

| Aktion   | Datei                                              |
|----------|-----------------------------------------------------|
| NEU      | `src/hooks/useSellerProfiles.ts`                   |
| NEU      | `src/components/settings/SellerProfileManager.tsx` |
| ÄNDERN   | `src/pages/Settings.tsx`                           |
| ÄNDERN   | `src/components/workflows/SinglePitchPaulDialog.tsx` |
| ÄNDERN   | `src/components/automation/AutomationDialog.tsx`   |
| NEU      | SQL-Migration für `seller_profiles` Tabelle        |

## Technische Details

### Datenbank-Migration SQL

```sql
-- Tabelle erstellen
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name text NOT NULL,
  name text NOT NULL,
  company text NOT NULL,
  address text,
  phone text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- Policies (gleich wie email_instructions)
CREATE POLICY "Authenticated users can read seller_profiles"
  ON public.seller_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert seller_profiles"
  ON public.seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update seller_profiles"
  ON public.seller_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete seller_profiles"
  ON public.seller_profiles FOR DELETE
  TO authenticated
  USING (true);
```

### UI-Verhalten bei Profilauswahl

1. Benutzer wählt Profil aus Dropdown
2. Alle Formularfelder werden mit Profil-Daten befüllt
3. Felder bleiben editierbar für einmalige Anpassungen
4. Bei Auswahl "Manuell eingeben" werden Felder geleert (oder behalten aktuellen Wert)

### Supabase Types Update

Nach dem Erstellen der Tabelle muss `src/integrations/supabase/types.ts` aktualisiert werden, um die neue Tabelle zu inkludieren.

## Vorteile

- Zeitersparnis: Verkäuferdaten nur einmal eingeben
- Konsistenz: Gleiche Daten in allen Workflows
- Mehrere Profile: Z.B. für verschiedene Mitarbeiter oder Abteilungen
- Flexibilität: Profile können jederzeit überschrieben werden
