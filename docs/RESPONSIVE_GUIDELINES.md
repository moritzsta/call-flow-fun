# Responsive Design Guidelines

**Projekt**: Cold Calling App  
**Version**: 1.0  
**Stand**: 2025-10-26

---

## 📱 Übersicht

Die Cold Calling App folgt einem **Mobile-First Ansatz** und ist vollständig responsive. Alle Komponenten und Pages funktionieren auf Bildschirmgrößen von 320px (Smartphones) bis 1920px+ (Desktop).

---

## 🎯 Breakpoints

Die App nutzt die Standard-Tailwind-Breakpoints:

| Breakpoint | Min-Width | Device Type |
|------------|-----------|-------------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

**Mobile-Detection**: Unter 768px wird als Mobile erkannt (`useIsMobile()` Hook).

---

## 🛠️ Responsive Komponenten

### 1. Navigation & Layout

#### Sidebar
- **Desktop**: Collapsible Sidebar (icon/expanded)
- **Mobile**: Sheet-basiert, ausblendbar via Hamburger-Menü
- **Component**: `src/components/layout/Sidebar.tsx`
- **Trigger**: `<SidebarTrigger />` in Header

#### Header
- **Desktop**: Full Width mit User-Dropdown
- **Mobile**: Kompakt mit Sidebar-Trigger und Avatar
- **Component**: `src/components/layout/Header.tsx`

---

### 2. Tabellen

#### ResponsiveTable Component
Alle Tabellen nutzen `<ResponsiveTable>` für optimale Mobile-UX.

**Verhalten**:
- **Desktop**: Standard-Tabelle mit allen Spalten
- **Mobile**: Card-View mit wichtigsten Infos

**Usage**:
```tsx
import { ResponsiveTable, MobileCard } from '@/components/ui/responsive-table';

const mobileView = (
  <div className="space-y-3">
    {items.map(item => (
      <MobileCard key={item.id} onClick={() => navigate(`/items/${item.id}`)}>
        {/* Kompakte Card-Darstellung */}
      </MobileCard>
    ))}
  </div>
);

<ResponsiveTable mobileView={mobileView}>
  <Table>
    {/* Desktop-Tabelle */}
  </Table>
</ResponsiveTable>
```

**Implementierte Tabellen**:
- `CompaniesTable` – Firmen-Übersicht
- `EmailsTable` – E-Mail-Übersicht

---

### 3. Dialoge & Modals

#### AdaptiveDialog Component
Dialoge werden auf Mobile als Bottom-Sheet dargestellt.

**Verhalten**:
- **Desktop**: Standard `<Dialog>`
- **Mobile**: `<Sheet side="bottom">` mit max-height 85vh

**Usage**:
```tsx
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';

<AdaptiveDialog
  title="Titel"
  description="Beschreibung"
  open={open}
  onOpenChange={setOpen}
>
  {/* Dialog-Inhalt */}
</AdaptiveDialog>
```

---

### 4. Forms & Inputs

**Touch-Optimierung**:
- Alle Buttons haben min-height von 44px (touch-target)
- Input-Felder sind touch-freundlich (min 16px font-size)
- Dropdowns und Selects nutzen native Mobile-Controls wo möglich

**Spacing**:
- Mobile: Kompaktere Abstände (`gap-3` statt `gap-6`)
- Desktop: Großzügigere Layouts

---

## 📄 Responsive Pages

### Dashboard
- **Mobile**: Stacked Cards, volle Breite
- **Desktop**: Grid-Layout (2-3 Spalten)

### ProjectCompanies / ProjectEmails
- **Mobile**: 
  - Header-Buttons full-width
  - Tabellen als Card-View
  - Kompaktere Titel
- **Desktop**: Standard-Layout

### Detail-Pages (Company, Email)
- **Mobile**: Single-Column Layout
- **Desktop**: Two-Column Layout mit Sidebar

---

## 🎨 Design-Tokens für Responsive

**Tailwind-Utilities**:
```tsx
// Conditional Rendering
const isMobile = useIsMobile();
{isMobile ? <MobileView /> : <DesktopView />}

// Responsive Classes
className="text-2xl md:text-3xl lg:text-4xl"
className="flex-col md:flex-row"
className="w-full md:w-auto"
```

---

## ✅ Testing-Checklist

Vor dem Deployment alle Pages auf diesen Geräten testen:

- [ ] **iPhone SE** (375x667) – Kleinster Smartphone
- [ ] **iPhone 14 Pro** (393x852) – Standard Smartphone
- [ ] **iPad Mini** (744x1133) – Small Tablet
- [ ] **iPad Pro** (1024x1366) – Large Tablet
- [ ] **Desktop 1280px** – Standard Laptop
- [ ] **Desktop 1920px** – Full HD Desktop

**Test-Szenarien**:
1. Navigation funktioniert (Sidebar öffnen/schließen)
2. Tabellen sind lesbar und scrollbar
3. Formulare sind ausfüllbar ohne Zoom
4. Buttons sind touch-optimiert
5. Dialoge passen auf Screen
6. Keine horizontalen Scrollbars (außer Tabellen)

---

## 🚀 Best Practices

### DOs ✅
- `useIsMobile()` Hook für conditional rendering
- Mobile-First CSS schreiben (`base → md → lg`)
- Touch-Targets min. 44x44px
- Horizontal-Scroll für komplexe Tabellen erlauben
- Bottom-Sheets für Mobile-Dialoge

### DON'Ts ❌
- Keine festen Pixel-Werte ohne Breakpoints
- Keine Hover-States als einzige Interaktion
- Keine zu kleinen Touch-Targets (<40px)
- Keine horizontalen Scrollbars im Main-Content
- Keine Popups die über Screen hinausgehen

---

## 📚 Weitere Ressourcen

- **Tailwind Responsive Design**: https://tailwindcss.com/docs/responsive-design
- **shadcn/ui Mobile**: https://ui.shadcn.com/docs/components
- **Web.dev Mobile Best Practices**: https://web.dev/mobile/

---

**Note**: Diese Guidelines werden kontinuierlich erweitert, sobald neue Komponenten oder Pages hinzugefügt werden.
