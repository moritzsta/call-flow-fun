# STYLE_GUIDE.md – Cold Calling App

**Projekt:** Cold Calling Automatisierungs-Plattform  
**Version:** 1.0  
**Stand:** 2025-10-25

---

## 🎨 Design-Prinzipien

### Klarheit
- **Einfache, verständliche UI:** Fokus auf die Hauptaktionen (Workflows triggern, Firmen verwalten, E-Mails versenden)
- **Wenig visuelle Ablenkung:** Klare Hierarchien, großzügiger Whitespace
- **Intuitive Navigation:** Maximal 3 Klicks zu jeder Hauptfunktion

### Konsistenz
- **Wiederverwendbare Patterns:** Alle Komponenten folgen dem Design-System
- **Feature Library Reuse:** Siehe `docs/feature-library/06-UI-UX-Pattern.md` für bewährte Patterns
- **Einheitliche Interaktionen:** Hover, Fokus, Loading-States überall gleich

### Performance
- **Lazy-Loading:** Bilder und schwere Komponenten nur bei Bedarf laden
- **Optimierte Assets:** WebP-Format für Bilder, SVG für Icons
- **Code-Splitting:** Route-basiertes Code-Splitting mit React Router

### Barrierefreiheit
- **WCAG AA-Konformität:** Mindestens 4.5:1 Kontrast für Text, 3:1 für UI-Elemente
- **Tastatur-Navigation:** Alle Funktionen ohne Maus erreichbar
- **Screenreader-Support:** Semantisches HTML, ARIA-Labels

---

## 🌈 Themes

Die Cold Calling App unterstützt **Light Mode** und **Dark Mode** mit optionalem High-Contrast-Modus für Barrierefreiheit.

### Light Theme
- **Hintergrund:** Weiß bis Hellgrau (`hsl(0, 0%, 100%)` → `hsl(0, 0%, 98%)`)
- **Text:** Dunkelgrau (`hsl(222, 47%, 11%)`)
- **Primärfarbe:** Professionelles Blau (`hsl(221, 83%, 53%)`) – vertrauenswürdig, business-tauglich
- **Akzentfarbe:** Energiegeladenes Orange (`hsl(25, 95%, 53%)`) für Call-to-Actions
- **Charakter:** Freundlich, professionell, produktiv

### Dark Theme
- **Hintergrund:** Dunkelblau-Grau (`hsl(222, 47%, 11%)` → `hsl(217, 33%, 17%)`)
- **Text:** Hellgrau (`hsl(0, 0%, 98%)`)
- **Primärfarbe:** Helleres Blau (`hsl(221, 83%, 60%)`) – besserer Kontrast auf dunklem Hintergrund
- **Akzentfarbe:** Wärmeres Orange (`hsl(25, 95%, 60%)`)
- **Charakter:** Augenschonend, modern, fokussiert

### Barrierefrei-Modus
- **Kontraste:** Mindestens 4.5:1 für Text (WCAG AA), 7:1 für wichtige UI-Elemente (AAA)
- **Motion:** Keine Animationen bei `prefers-reduced-motion: reduce`
- **Fokus:** 2px solide Fokus-Ringe in Primärfarbe mit zusätzlichem Offset
- **Farben:** Verstärkte Kontraste, keine Farbcodierung als einzige Information
- **Aktivierung:** Automatisch bei Systemeinstellung oder manuell über Theme-Switcher

---

## 🔤 Typografie

### Schriftfamilien

**Primär (UI & Body):**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```
- **Verwendung:** Fließtext, Formulare, UI-Komponenten
- **Eigenschaften:** Hervorragende Lesbarkeit, optimiert für Bildschirme, professionell
- **Google Fonts Link:** `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

**Headlines (Optional):**
```css
font-family: 'Inter', sans-serif; /* Gleiche Schrift für Konsistenz */
```
- **Verwendung:** H1, H2, H3
- **Alternative:** Falls gewünscht: `'Poppins'` für Headlines (moderner, etwas verspielter)

**Monospace (Code & Technisch):**
```css
font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
```
- **Verwendung:** Webhook-URLs, JSON-Ausgaben, technische Details

### Größen-Hierarchie

| Element | Größe | Gewicht | Verwendung |
|---------|-------|---------|------------|
| **H1** | `2.5rem` (40px) | 700 (Bold) | Page-Titel, Hero-Headlines |
| **H2** | `2rem` (32px) | 600 (Semibold) | Section-Überschriften |
| **H3** | `1.5rem` (24px) | 600 (Semibold) | Sub-Sections, Card-Titel |
| **H4** | `1.25rem` (20px) | 600 (Semibold) | Kleinere Überschriften |
| **Body (Base)** | `1rem` (16px) | 400 (Regular) | Fließtext, Formulare |
| **Small** | `0.875rem` (14px) | 400 (Regular) | Meta-Informationen, Captions |
| **Tiny** | `0.75rem` (12px) | 400 (Regular) | Timestamps, Badges |

### Zeilenhöhen

- **Headlines (H1-H4):** `1.2` – Kompakt, klar
- **Body:** `1.6` – Angenehm lesbar für längere Texte
- **Dense (Tabellen):** `1.4` – Mehr Inhalt auf weniger Raum
- **Relaxed (Hero):** `1.8` – Luftig, einladend

### Schriftgewichte

- **Regular (400):** Standardtext
- **Medium (500):** Betonte Labels
- **Semibold (600):** Buttons, Sub-Headlines
- **Bold (700):** Headlines, kritische Call-to-Actions

---

## 🎨 Farb-System (HSL-basiert)

**WICHTIG:** Alle Farben sind HSL-basiert und in `src/index.css` als CSS-Variablen definiert. Nie direkte Farben wie `bg-blue-500` verwenden!

### Primärfarben

**Primary (Hauptfarbe):**
- **Light Mode:** `hsl(221, 83%, 53%)` – Professionelles Blau
- **Dark Mode:** `hsl(221, 83%, 60%)` – Etwas heller für besseren Kontrast
- **Verwendung:** Primär-Buttons, Links, aktive Navigation, wichtige Icons

**Primary Foreground:**
- **Immer:** `hsl(0, 0%, 100%)` – Weißer Text auf Primary-Hintergrund

**Secondary (Sekundärfarbe):**
- **Light Mode:** `hsl(210, 40%, 96%)` – Sehr helles Blau-Grau
- **Dark Mode:** `hsl(217, 33%, 17%)` – Dunkelblau-Grau
- **Verwendung:** Sekundär-Buttons, Hintergründe für Cards

**Accent (Akzentfarbe):**
- **Light Mode:** `hsl(25, 95%, 53%)` – Energiegeladenes Orange
- **Dark Mode:** `hsl(25, 95%, 60%)` – Etwas heller
- **Verwendung:** Call-to-Actions, Workflow-Trigger-Buttons, wichtige Badges

### Statusfarben

**Success:**
- **Light Mode:** `hsl(142, 76%, 36%)` – Grün
- **Dark Mode:** `hsl(142, 76%, 45%)` – Helleres Grün
- **Verwendung:** Erfolgsmeldungen, "E-Mail versendet", "Workflow completed"

**Warning:**
- **Light Mode:** `hsl(38, 92%, 50%)` – Orange/Gelb
- **Dark Mode:** `hsl(38, 92%, 55%)` – Etwas heller
- **Verwendung:** Warnungen, "Workflow running", "Draft"

**Error (Destructive):**
- **Light Mode:** `hsl(0, 84%, 60%)` – Rot
- **Dark Mode:** `hsl(0, 84%, 65%)` – Etwas heller
- **Verwendung:** Fehlermeldungen, "Workflow failed", Delete-Buttons

**Info:**
- **Light Mode:** `hsl(199, 89%, 48%)` – Hellblau
- **Dark Mode:** `hsl(199, 89%, 55%)` – Etwas heller
- **Verwendung:** Info-Toasts, Hilfe-Texte, "Pending"-Status

### Neutrale Farben

**Background:**
- **Light Mode:** `hsl(0, 0%, 100%)` – Reines Weiß
- **Dark Mode:** `hsl(222, 47%, 11%)` – Dunkelblau-Grau

**Foreground (Text):**
- **Light Mode:** `hsl(222, 47%, 11%)` – Dunkelgrau (fast Schwarz)
- **Dark Mode:** `hsl(0, 0%, 98%)` – Fast Weiß

**Muted (Gedämpfte Elemente):**
- **Light Mode:** `hsl(210, 40%, 96%)` – Sehr helles Grau
- **Dark Mode:** `hsl(217, 33%, 17%)` – Dunkelgrau
- **Verwendung:** Hintergründe für inaktive Elemente, Hover-States

**Border:**
- **Light Mode:** `hsl(214, 32%, 91%)` – Helles Grau
- **Dark Mode:** `hsl(217, 33%, 21%)` – Dunkelgrau
- **Verwendung:** Borders, Separatoren

### Gradients

**Primary Gradient:**
```css
background: linear-gradient(135deg, hsl(221, 83%, 53%) 0%, hsl(265, 89%, 60%) 100%);
```
- **Von:** Professionelles Blau
- **Bis:** Lila (Kreativität + Innovation)
- **Verwendung:** Hero-Sections, Feature-Cards (optional)

**Subtle Gradient:**
```css
background: linear-gradient(180deg, hsl(0, 0%, 100%) 0%, hsl(210, 40%, 98%) 100%);
```
- **Von:** Weiß
- **Bis:** Sehr helles Blau-Grau
- **Verwendung:** Page-Hintergründe, große Container

**Accent Gradient (Call-to-Action):**
```css
background: linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(10, 80%, 50%) 100%);
```
- **Von:** Orange
- **Bis:** Rot-Orange
- **Verwendung:** Wichtige Buttons ("Workflow starten")

---

## 🎭 Motion & Feedback

### Micro-Animationen

**Button Hover:**
```css
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
transform: scale(1.02);
```
- **Dauer:** 150ms
- **Effekt:** Sanfte Skalierung (2% größer)
- **Easing:** `ease-out`

**Card Hover:**
```css
transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
box-shadow: 0 10px 30px -10px hsl(var(--primary) / 0.2);
```
- **Dauer:** 200ms
- **Effekt:** Schatten-Lift (Card hebt sich ab)
- **Easing:** `ease-out`

**Link Underline (Story-Link Pattern):**
```css
.story-link {
  position: relative;
}
.story-link::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: 0;
  left: 0;
  background: hsl(var(--primary));
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 300ms ease-out;
}
.story-link:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}
```

### Dauer & Timing

| Kategorie | Dauer | Verwendung |
|-----------|-------|------------|
| **Quick** | 150ms | Hover, Klicks, Fokus-Änderungen |
| **Normal** | 300ms | Übergänge, Toasts, Dialoge |
| **Slow** | 500ms | Große Bewegungen, Slide-Ins, komplexe Animationen |
| **Delayed** | 100ms delay | Nacheinander erscheinende Elemente (Cards, Listen) |

**Easing-Funktionen:**
- **ease-out:** `cubic-bezier(0.4, 0, 0.2, 1)` – Standard für Übergänge
- **ease-in:** `cubic-bezier(0.4, 0, 1, 1)` – Für Exit-Animationen
- **ease-in-out:** `cubic-bezier(0.4, 0, 0.2, 1)` – Für hin-und-her-Bewegungen

### Reduzierte Bewegungen (A11y)

**Respektiere `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
- **Keine Animationen:** Nur sofortige Farbwechsel
- **Ausnahme:** Fokus-Ringe bleiben (wichtig für Navigation)

---

## 🧩 Komponenten-Patterns

### Buttons

**Primary Button:**
```tsx
<Button variant="default">
  Workflow starten
</Button>
```
- **Style:** Farbiger Hintergrund (Primary), Weißer Text, Rounded
- **Hover:** Dunkler (10% mehr Sättigung), leichter Schatten
- **Disabled:** Opacity 0.5, kein Pointer
- **Verwendung:** Hauptaktionen (Workflow triggern, Speichern)

**Secondary Button:**
```tsx
<Button variant="secondary">
  Abbrechen
</Button>
```
- **Style:** Muted-Hintergrund, Primary-Text
- **Hover:** Füllung mit Primary-Hintergrund
- **Verwendung:** Sekundäre Aktionen (Abbrechen, Zurück)

**Outline Button:**
```tsx
<Button variant="outline">
  Details anzeigen
</Button>
```
- **Style:** Transparenter Hintergrund, Border in Primary
- **Hover:** Füllung mit Muted-Hintergrund
- **Verwendung:** Tertiäre Aktionen (Details, Optionen)

**Ghost Button:**
```tsx
<Button variant="ghost">
  <Settings className="mr-2 h-4 w-4" />
  Einstellungen
</Button>
```
- **Style:** Komplett transparent, nur Icon/Text
- **Hover:** Muted-Hintergrund
- **Verwendung:** Navigation, Icon-Buttons

**Destructive Button:**
```tsx
<Button variant="destructive">
  Projekt löschen
</Button>
```
- **Style:** Error-Hintergrund, Weißer Text
- **Hover:** Dunkler
- **Verwendung:** Irreversible Aktionen (Löschen, Ablehnen)

### Cards

**Standard Card:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Projekt-Titel</CardTitle>
    <CardDescription>Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Inhalt */}
  </CardContent>
</Card>
```
- **Style:** Border, Rounded, Muted-Hintergrund (optional)
- **Hover:** Kein Effekt (nur Anzeige)

**Interactive Card (Klickbar):**
```tsx
<Card className="cursor-pointer hover:shadow-lg transition-shadow">
  {/* Inhalt */}
</Card>
```
- **Style:** Wie Standard Card
- **Hover:** Shadow-Lift, Cursor-Pointer
- **Verwendung:** Projekt-Cards, Organisation-Cards

**Highlight Card (Wichtig):**
```tsx
<Card className="border-primary bg-primary/5">
  {/* Inhalt */}
</Card>
```
- **Style:** Primary-Border, leichter Primary-Hintergrund
- **Verwendung:** Aktive Workflows, wichtige KPIs

### Forms

**Input Fields:**
```tsx
<Input
  type="text"
  placeholder="Firmenname"
  className="border-input focus:border-primary"
/>
```
- **Style:** Border, Rounded, Padding
- **Fokus:** Primary-Border, Fokus-Ring
- **Error:** Error-Border (`border-destructive`)

**Labels:**
```tsx
<Label htmlFor="email" className="font-semibold">
  E-Mail-Adresse
</Label>
```
- **Position:** Über Input
- **Style:** Semibold, Small-Size
- **Erforderlich:** Rotes Sternchen `*` bei Pflichtfeldern

**Error Messages:**
```tsx
<p className="text-destructive text-sm mt-1">
  Dieses Feld ist erforderlich.
</p>
```
- **Style:** Error-Farbe, Small-Size
- **Position:** Unter Input

**Helper Text:**
```tsx
<p className="text-muted-foreground text-sm mt-1">
  Geben Sie die Branche ein (z.B. "Solartechnik")
</p>
```
- **Style:** Muted-Farbe, Small-Size
- **Position:** Unter Input

### Toasts (Notifications)

**Position:** Bottom-Right (Desktop), Top (Mobile)

**Success Toast:**
```tsx
toast({
  title: "Erfolg",
  description: "E-Mail wurde versendet.",
  variant: "success",
});
```
- **Duration:** 3s
- **Style:** Success-Border links, grünes Icon

**Error Toast:**
```tsx
toast({
  title: "Fehler",
  description: "E-Mail konnte nicht versendet werden.",
  variant: "destructive",
});
```
- **Duration:** 5s
- **Style:** Error-Border links, rotes Icon

**Info Toast:**
```tsx
toast({
  title: "Information",
  description: "Workflow wurde gestartet.",
});
```
- **Duration:** 4s
- **Style:** Info-Border links, blaues Icon

### Badges

**Status Badges:**
```tsx
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Running</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="secondary">Pending</Badge>
```
- **Style:** Rounded, Small-Size, Semibold
- **Farben:** Status-abhängig (Success, Warning, Error, Secondary)

**Role Badges:**
```tsx
<Badge variant="outline">Owner</Badge>
<Badge variant="outline">Manager</Badge>
<Badge variant="outline">Read-Only</Badge>
```
- **Style:** Outline, keine Füllung

### Dialoge & Modals

**Standard Dialog:**
```tsx
<Dialog>
  <DialogTrigger>Workflow starten</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Finder Felix starten</DialogTitle>
      <DialogDescription>
        Geben Sie die Suchkriterien ein.
      </DialogDescription>
    </DialogHeader>
    {/* Form */}
    <DialogFooter>
      <Button variant="outline">Abbrechen</Button>
      <Button>Starten</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
- **Background:** Overlay mit 50% Opacity
- **Animation:** Fade-in + Scale-in (300ms)
- **Close:** X-Button oben rechts, Escape-Taste, Overlay-Klick

**Alert Dialog (Bestätigung):**
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Projekt löschen</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
      <AlertDialogDescription>
        Diese Aktion kann nicht rückgängig gemacht werden.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
      <AlertDialogAction variant="destructive">
        Ja, löschen
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```
- **Verwendung:** Irreversible Aktionen (Löschen, Archivieren)

### Tables

**Responsive Table:**
```tsx
<div className="overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Firma</TableHead>
        <TableHead>Branche</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>Muster GmbH</TableCell>
        <TableCell>Solartechnik</TableCell>
        <TableCell>
          <Badge variant="success">Analyzed</Badge>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```
- **Style:** Border, Zebra-Stripes (optional)
- **Hover:** Row-Highlight
- **Mobile:** Horizontal Scroll oder Card-View

### Navigation

**Top Navigation:**
```tsx
<nav className="border-b bg-background">
  <div className="container flex h-16 items-center justify-between">
    <div className="flex items-center gap-6">
      <Logo />
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/organizations">Organisationen</NavLink>
      <NavLink to="/projects">Projekte</NavLink>
    </div>
    <UserDropdown />
  </div>
</nav>
```
- **Active Route:** Primary-Farbe, Underline (2px)
- **Hover:** Muted-Hintergrund

**Sidebar (Optional):**
- Siehe `<shadcn-sidebar>` in Useful Context
- **Kollabierbar:** Mini-Version (nur Icons) oder vollständig verborgen
- **Active Route:** Primary-Hintergrund, Bold-Text

---

## ♿ Accessibility (A11y) Checks

### Kontrast-Ratios (WCAG AA)

**Text:**
- **Normal Text (< 18px):** Mindestens 4.5:1
- **Large Text (≥ 18px oder ≥ 14px Bold):** Mindestens 3:1
- **Beispiel:** `hsl(222, 47%, 11%)` auf `hsl(0, 0%, 100%)` = 15.4:1 ✅

**UI-Elemente:**
- **Borders, Icons:** Mindestens 3:1
- **Beispiel:** `hsl(214, 32%, 91%)` auf `hsl(0, 0%, 100%)` = 1.3:1 ❌ → Verwende `hsl(214, 32%, 70%)` für 3.1:1 ✅

**Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools → Lighthouse → Accessibility

### Tastatur-Navigation

**Checklist:**
- [ ] Alle interaktiven Elemente sind per Tab erreichbar
- [ ] Fokus-Reihenfolge ist logisch (top → bottom, left → right)
- [ ] Dialoge: Fokus wird in Dialog gelockt (Focus Trap), Escape schließt
- [ ] Dropdowns: Pfeiltasten zur Navigation, Enter zum Auswählen
- [ ] Formulare: Enter submitted Form, Shift+Tab geht zurück

**Fokus-Ringe:**
```css
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```
- **NIEMALS:** `outline: none` ohne Alternative!

### ARIA-Labels & Semantic HTML

**Buttons ohne Text:**
```tsx
<Button variant="ghost" aria-label="Einstellungen öffnen">
  <Settings className="h-4 w-4" />
</Button>
```

**Form-Labels:**
```tsx
<Label htmlFor="company-name">Firmenname</Label>
<Input id="company-name" />
```

**Status-Updates (Live Regions):**
```tsx
<div role="status" aria-live="polite">
  Workflow wird gestartet...
</div>
```

**Semantic HTML:**
- `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- Niemals: `<div>` statt `<button>` für interaktive Elemente

### Alt-Texte für Bilder

**Dekorative Bilder:**
```tsx
<img src="hero.jpg" alt="" /> {/* Leerer Alt-Text */}
```

**Informative Bilder:**
```tsx
<img src="workflow-diagram.png" alt="Diagramm des Finder Felix Workflows" />
```

### Reduzierte Bewegungen

**Automatisch respektieren:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📐 Spacing & Layout

### Spacing-Scale (Tailwind)

| Token | Wert | Verwendung |
|-------|------|------------|
| `spacing-1` | 0.25rem (4px) | Tiny Gaps |
| `spacing-2` | 0.5rem (8px) | Small Gaps |
| `spacing-4` | 1rem (16px) | Standard Gaps |
| `spacing-6` | 1.5rem (24px) | Medium Gaps |
| `spacing-8` | 2rem (32px) | Large Gaps |
| `spacing-12` | 3rem (48px) | Section-Abstände |
| `spacing-16` | 4rem (64px) | Hero-Sections |

### Container-Widths

**Max-Width:**
- **Small:** `max-w-2xl` (672px) – Formulare, Dialoge
- **Medium:** `max-w-4xl` (896px) – Content-Seiten
- **Large:** `max-w-6xl` (1152px) – Dashboards, Tabellen
- **Full:** `max-w-7xl` (1280px) – Landing Pages

**Padding:**
- **Desktop:** `px-8` (2rem)
- **Tablet:** `px-6` (1.5rem)
- **Mobile:** `px-4` (1rem)

### Grid & Flex

**Grid (Responsive):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

**Flex (Center):**
```tsx
<div className="flex items-center justify-center min-h-screen">
  {/* Login-Form */}
</div>
```

---

## 🎯 Responsive Breakpoints

| Breakpoint | Tailwind | Wert | Verwendung |
|-----------|----------|------|------------|
| **Mobile** | `default` | < 640px | Single-Column-Layout |
| **Tablet** | `sm:` | ≥ 640px | 2-Column-Grid |
| **Small Desktop** | `md:` | ≥ 768px | Sidebar erscheint |
| **Desktop** | `lg:` | ≥ 1024px | 3-Column-Grid |
| **Large Desktop** | `xl:` | ≥ 1280px | Max-Width erreicht |
| **Extra Large** | `2xl:` | ≥ 1536px | Mehr Whitespace |

**Mobile-First Approach:**
```tsx
<div className="p-4 md:p-6 lg:p-8">
  {/* Padding wächst mit Viewport */}
</div>
```

---

## 📸 Assets & Media

### Bilder

**Format:**
- **WebP:** Primär (moderne Browser, beste Kompression)
- **JPEG:** Fallback (ältere Browser)
- **SVG:** Icons, Logos (skalierbar)

**Optimierung:**
- **Lazy-Loading:** `loading="lazy"` für Off-Screen-Bilder
- **Responsive:** `srcset` für verschiedene Auflösungen
- **Platzhalter:** Skeleton oder Blur-Up während Loading

### Icons

**Lucide React:**
```tsx
import { Camera, Settings } from 'lucide-react';

<Camera color="red" size={24} strokeWidth={2} />
```
- **Größen:** 16px (Small), 20px (Medium), 24px (Large)
- **Stroke:** 2px (Standard), 1.5px (Lighter), 2.5px (Bold)

---

## 📚 Referenzen

### Design-Tools

- **Farb-Kontrast:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **HSL-Generator:** [HSL Color Picker](https://hslpicker.com/)
- **Gradient-Generator:** [CSS Gradient](https://cssgradient.io/)
- **Icon-Suche:** [Lucide Icons](https://lucide.dev/icons/)

### Feature Library

- **UI/UX-Patterns:** `docs/feature-library/06-UI-UX-Pattern.md`
- **Security-Patterns:** `docs/feature-library/03-Security-Pattern.md`
- **Design-System-Reuse:** Siehe Feature Library für wiederverwendbare Komponenten

### BUILD_PROMPTS Referenzen

- **Task 037:** Design System & HSL-Tokens → Siehe Sections "Farb-System", "Themes"
- **Task 038:** Responsive Design → Siehe Sections "Responsive Breakpoints", "Layout"
- **Task 040:** Loading States → Siehe Section "Komponenten-Patterns"
- **Task 043:** Accessibility → Siehe Section "A11y-Checks"

---

## 🔄 Changelog

**2025-10-25:**
- Initiale Version erstellt
- HSL-basiertes Farb-System definiert
- Komponenten-Patterns dokumentiert
- A11y-Guidelines hinzugefügt

---

**Ende des Style Guides** ✅
