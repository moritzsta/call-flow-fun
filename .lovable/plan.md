

## E-Mail-Anweisungen - Vereinfachter Implementierungsplan

### Zusammenfassung
E-Mail-Anweisungen werden als vordefinierte Texte gespeichert, die der User beim Starten von Pitch Paul aus einem Dropdown auswählen kann. Bei Auswahl wird der Inhalt direkt in das **bestehende `vorhaben`-Feld** eingefügt. Es werden keine neuen Webhook-Parameter benötigt - die Anweisung läuft über die existierende `vorhaben`/`userGoal` Variable.

### Architektur-Übersicht

```text
+------------------+     +------------------------+
|  Settings.tsx    |     | SinglePitchPaulDialog  |
|  (4. Tab)        |     |                        |
+--------+---------+     +------------+-----------+
         |                            |
         v                            v
+-------------------+     +------------------------+
| EmailInstruction  |     | useEmailInstructions() |
| Manager.tsx       |     |   → Dropdown           |
+-------------------+     +------------------------+
         |                            |
         v                            v
+------------------------------------------------+
|           email_instructions (DB)              |
+------------------------------------------------+
                      |
                      | (Anweisung wird in vorhaben geschrieben)
                      v
+-----------------------------------+
| trigger-n8n-workflow              |
|  → vorhaben (unverändert)         |
+-----------------------------------+
```

### Zu erstellende/ändernde Dateien

#### 1. Neue Datenbanktabelle: `email_instructions`
Struktur analog zu `analyse_instructions`:
- `id` (UUID, Primary Key)
- `name` (Text, NOT NULL) - z.B. "Formeller Geschäftsstil"
- `instruction` (Text, NOT NULL) - Der vordefinierte Anweisungstext
- `created_at`, `updated_at` (Timestamps)

RLS-Policies für authentifizierte Benutzer (lesen, schreiben, aktualisieren, löschen).

#### 2. Neuer Hook: `src/hooks/useEmailInstructions.ts`
Kopie von `useAnalyseInstructions.ts`:
- Query-Key: `email-instructions`
- Tabelle: `email_instructions`
- CRUD-Operationen

#### 3. Neue Komponente: `src/components/settings/EmailInstructionManager.tsx`
Kopie von `AnalyseInstructionManager.tsx`:
- Icon: `MessageSquareText`
- Titel: "E-Mail-Anweisungen verwalten"
- Beschreibung: "Erstellen und bearbeiten Sie Anweisungen für die E-Mail-Generierung durch Pitch Paul."

#### 4. Änderung: `src/pages/Settings.tsx`
- TabsList von 3 auf 4 Spalten erweitern
- Neuen Tab "E-Mail-Anweisungen" hinzufügen
- Import und Einbindung von `EmailInstructionManager`

#### 5. Änderung: `src/components/workflows/SinglePitchPaulDialog.tsx`
Neues Dropdown über der Textarea:
- "Eigene Anweisung" (Default) - Textarea bleibt leer und editierbar
- Liste aller gespeicherten E-Mail-Anweisungen
- Bei Auswahl einer DB-Anweisung: `setValue('vorhaben', instruction.instruction)`
- Textarea bleibt immer editierbar (User kann nach Auswahl noch anpassen)

---

### Technische Details

#### Dialog-Logik in SinglePitchPaulDialog

```typescript
import { useEmailInstructions } from '@/hooks/useEmailInstructions';

// Im Dialog:
const { instructions: emailInstructions, isLoading: instructionsLoading } = useEmailInstructions();
const [selectedInstructionId, setSelectedInstructionId] = useState<string>('custom');

const handleInstructionChange = (instructionId: string) => {
  setSelectedInstructionId(instructionId);
  
  if (instructionId === 'custom') {
    // Leeren für eigene Eingabe
    setValue('vorhaben', '');
  } else {
    // DB-Anweisung in vorhaben-Feld schreiben
    const instruction = emailInstructions.find(i => i.id === instructionId);
    if (instruction) {
      setValue('vorhaben', instruction.instruction);
    }
  }
};
```

#### UI-Änderung im Dialog

```text
+------------------------------------------+
|  Anweisung auswählen                     |
|  +------------------------------------+  |
|  | [Dropdown]                         |  |
|  | - Eigene Anweisung (default)       |  |
|  | - Formeller Geschäftsstil          |  |
|  | - Freundlich & persönlich          |  |
|  | - Sales-orientiert                 |  |
|  +------------------------------------+  |
|                                          |
|  Ihr Vorhaben *                          |
|  +------------------------------------+  |
|  | Textarea                           |  |
|  | (vorausgefüllt bei DB-Auswahl,     |  |
|  |  aber immer editierbar)            |  |
|  +------------------------------------+  |
+------------------------------------------+
```

---

### Implementierungsreihenfolge

1. **Datenbank-Migration**
   - Tabelle `email_instructions` erstellen
   - RLS-Policies hinzufügen
   - Trigger für `updated_at`

2. **Hook erstellen** (`useEmailInstructions.ts`)
   - CRUD-Operationen

3. **Manager-Komponente erstellen** (`EmailInstructionManager.tsx`)
   - UI für Verwaltung in Settings

4. **Settings.tsx erweitern**
   - 4. Tab hinzufügen

5. **SinglePitchPaulDialog anpassen**
   - Dropdown für Anweisungsauswahl
   - Bei Auswahl: `vorhaben`-Feld befüllen

---

### Keine Änderungen erforderlich

- `src/types/workflow.ts` - keine neuen Felder nötig
- `supabase/functions/trigger-n8n-workflow/index.ts` - `vorhaben` wird bereits korrekt übergeben
- n8n Webhook - empfängt weiterhin `userGoal` / `vorhaben`

---

### Beispiel-Anweisungen

Nach der Implementierung könnten Benutzer z.B. folgende Anweisungen anlegen:

1. **"Formeller Geschäftsstil"**
   > Schreibe professionelle, formelle E-Mails mit Siezen. Verwende eine sachliche Sprache und halte die E-Mail kurz und prägnant.

2. **"Freundlich & persönlich"**
   > Schreibe freundliche E-Mails mit persönlicher Note. Zeige echtes Interesse am Empfänger und seinen Bedürfnissen.

3. **"Sales-orientiert"**
   > Fokussiere auf den Mehrwert für den Kunden. Nutze überzeugende Formulierungen und einen klaren Call-to-Action.

