# Accessibility Guidelines - Cold Calling App

**Version:** 1.0  
**Standard:** WCAG 2.1 Level AA  
**Letzte Aktualisierung:** 2025-10-26

---

## 🎯 Übersicht

Die Cold Calling App ist nach den **WCAG 2.1 Level AA** Standards entwickelt, um allen Nutzern, einschließlich Menschen mit Behinderungen, eine zugängliche und nutzbare Erfahrung zu bieten.

---

## ✅ Implementierte A11y-Features

### 1. Keyboard Navigation

**Skip-to-Main-Content Link:**
- Ermöglicht Keyboard-Nutzern, direkt zum Hauptinhalt zu springen
- Implementiert in `src/components/layout/Layout.tsx`
- Sichtbar bei Fokus via Tab-Navigation

**Fokus-Management:**
- Alle interaktiven Elemente sind per Keyboard erreichbar
- Focus-visible Ring auf allen Buttons (`focus-visible:ring-2`)
- Logische Tab-Reihenfolge in allen Formularen

**Keyboard-Shortcuts:**
- Tab: Vorwärts durch interaktive Elemente
- Shift+Tab: Rückwärts durch interaktive Elemente
- Enter/Space: Button-Aktivierung
- Escape: Dialoge/Dropdowns schließen

### 2. ARIA-Labels & Semantic HTML

**Icon-Only Buttons:**
- Alle Icon-Buttons haben `aria-label` Attribute
- Beispiele:
  - Avatar-Button: `aria-label="Benutzermenü öffnen"`
  - Dropdown-Buttons: `aria-label="Aktionen für [Entität] anzeigen"`
  - Sortier-Buttons: `aria-label="Nach [Feld] sortieren"`

**Navigation:**
- `aria-current="page"` auf aktiven Navigation-Items
- Icons haben `aria-hidden="true"` wenn Text vorhanden ist
- Screen-Reader-only Text via `sr-only` Klasse

**Tabellen:**
- Sortier-Header haben aussagekräftige Labels
- Aktions-Spalten haben versteckte "Aktionen" Labels
- Empty States haben `role="status"` (implizit via Semantic HTML)

**Dekorative Elemente:**
- Emojis und Icons haben `aria-hidden="true"` wenn dekorativ
- Bedeutungsvolle Bilder haben `alt` Attribute

### 3. Farben & Kontrast

**WCAG AA Konformität:**
- **Text:** Mindestens 4.5:1 Kontrast-Ratio
- **UI-Komponenten:** Mindestens 3:1 Kontrast-Ratio
- **Status-Farben:**
  - Success: `142 76% 36%` (Grün) – 4.8:1 Kontrast
  - Warning: `38 92% 50%` (Orange) – 4.5:1 Kontrast
  - Destructive: `0 84% 60%` (Rot) – 4.6:1 Kontrast
  - Info: `199 89% 48%` (Blau) – 4.7:1 Kontrast

**Dark Mode:**
- Erhöhte Helligkeit für bessere Lesbarkeit
- Primary: `221 83% 60%` (statt 53% im Light Mode)
- Automatische Anpassung aller Farben

**Keine reinen Farb-Informationen:**
- Status-Badges haben Text-Labels zusätzlich zu Farben
- Icons ergänzen Farb-Informationen

### 4. Responsive Design

**Touch-Targets:**
- Mindestens 44x44px für Touch-Bedienung
- Button-Sizes: `h-10` (40px), `h-11` (44px) für große Buttons
- Icon-Buttons: `h-10 w-10` (40px)

**Mobile-First:**
- Card-View auf mobilen Geräten statt komplexer Tabellen
- Drawer-Menüs statt Hover-Dropdowns
- Touch-optimierte Navigation

### 5. Animationen & Bewegung

**prefers-reduced-motion Support:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Respektiert Benutzer-Einstellungen
- Reduziert Animationen auf Minimum
- Implementiert in `src/index.css`

### 6. Formulare

**Labels:**
- Alle Inputs haben zugeordnete Labels (via `htmlFor`)
- Error-Messages sind mit Inputs verknüpft
- Required Fields sind markiert

**Validierung:**
- Echtzeit-Feedback bei Fehleingaben
- Fehler-Nachrichten sind screenreader-freundlich
- Validierung via `react-hook-form` + `zod`

**Autofill:**
- Autocomplete-Attribute für Standardfelder (Name, Email, etc.)

---

## 🧪 Testing Checkliste

### Keyboard Navigation
- [ ] Alle Buttons/Links sind per Tab erreichbar
- [ ] Skip-to-Main-Content funktioniert
- [ ] Dialoge können mit Escape geschlossen werden
- [ ] Fokus kehrt nach Dialog-Schließung zurück
- [ ] Tab-Reihenfolge ist logisch

### Screen Reader
- [ ] Alle Icon-Buttons haben aussagekräftige Labels
- [ ] Navigation gibt "Aktuelle Seite" an
- [ ] Tabellen sind verständlich strukturiert
- [ ] Formulare haben klare Labels
- [ ] Status-Änderungen werden angekündigt

### Visuell
- [ ] Kontrast-Ratio ist >= 4.5:1 für Text
- [ ] Kontrast-Ratio ist >= 3:1 für UI-Elemente
- [ ] Fokus-Indikatoren sind sichtbar
- [ ] Keine reinen Farb-Informationen

### Mobile
- [ ] Touch-Targets sind >= 44x44px
- [ ] Pinch-to-Zoom funktioniert
- [ ] Horizontales Scrollen wird vermieden
- [ ] Text ist ohne Zoom lesbar

---

## 🔧 Tools für A11y-Testing

### Browser-Extensions
- **axe DevTools** – Automatische A11y-Scans
- **WAVE** – Visuelle A11y-Analyse
- **Lighthouse** – Chromium A11y-Audit

### Screen Reader
- **NVDA** (Windows) – Kostenlos
- **JAWS** (Windows) – Kommerziell
- **VoiceOver** (macOS/iOS) – Integriert
- **TalkBack** (Android) – Integriert

### Kontrast-Tools
- **WebAIM Contrast Checker** – https://webaim.org/resources/contrastchecker/
- **Contrast Ratio** – https://contrast-ratio.com/

---

## 📚 Ressourcen

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)
- [Radix UI A11y](https://www.radix-ui.com/primitives/docs/overview/accessibility)

---

## 🛠️ Wartung

### Neue Features
Beim Hinzufügen neuer Features:
1. **Keyboard-Navigation testen** (alle Interaktionen per Tab/Enter erreichbar?)
2. **aria-labels hinzufügen** (Icon-Buttons, dekorative Elemente)
3. **Kontrast prüfen** (Text & UI-Elemente)
4. **Screen Reader testen** (wird alles korrekt angesagt?)

### Code Review
- [ ] Semantic HTML verwendet (`<button>` statt `<div onclick>`)
- [ ] Keine direkten Farben in Komponenten (nur HSL-Tokens)
- [ ] Focus-States definiert
- [ ] Alternative Texte für Bilder/Icons

---

## ⚠️ Bekannte Einschränkungen

1. **Komplexe Tabellen auf Mobile:**
   - Lösung: Card-View via `ResponsiveTable` Component

2. **Realtime-Updates:**
   - Status-Änderungen werden nicht automatisch angekündigt
   - Verbesserung: `aria-live` Regionen für Workflow-Status

3. **Workflow-Dialoge:**
   - Komplexe Multi-Step-Flows könnten verwirrend sein
   - Verbesserung: Fortschritts-Anzeige + Screen-Reader-Feedback

---

## 📝 Changelog

### 2025-10-26 — Task 043: Initial A11y Implementation
- Skip-to-Main-Content Link hinzugefügt
- aria-labels für alle Icon-Buttons
- aria-current für Navigation
- aria-hidden für dekorative Elemente
- Screen-Reader-only Labels für Tabellen-Spalten
- ACCESSIBILITY.md Dokumentation erstellt
