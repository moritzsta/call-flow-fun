# Testing Documentation - Cold Calling App

**Projekt**: Cold Calling Automatisierungs-Plattform  
**Testing Framework**: Vitest + React Testing Library  
**Stand**: 2025-10-25

---

## 📋 Überblick

Diese Dokumentation beschreibt die Test-Strategie und -Implementierung für die Cold Calling App. Das Projekt verwendet **Vitest** für Unit-Tests und **React Testing Library** für Component-Tests.

---

## 🛠️ Setup

### Abhängigkeiten

Die folgenden Testing-Pakete sind installiert:

- `vitest` - Test-Runner und Framework
- `@testing-library/react` - React Component Testing
- `@testing-library/jest-dom` - DOM-Matcher für bessere Assertions
- `@vitest/ui` - UI für Test-Results
- `jsdom` - DOM-Umgebung für Tests

### Konfiguration

**vitest.config.ts:**
- Environment: `jsdom` (für Browser-ähnliche Umgebung)
- Setup-File: `src/test/setup.ts`
- Coverage Provider: `v8`
- Alias: `@` → `./src`

**package.json Scripts:**
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

---

## 📝 Test-Struktur

### Verzeichnisstruktur

```
src/
├── components/
│   ├── __tests__/
│   │   └── Button.test.tsx
│   └── ui/
│       └── button.tsx
├── hooks/
│   ├── __tests__/
│   │   └── useAuth.test.ts (TODO)
│   └── useAuth.ts
├── test/
│   └── setup.ts
└── ...
```

### Naming Conventions

- Test-Dateien: `*.test.tsx` oder `*.test.ts`
- Test-Verzeichnisse: `__tests__/` neben dem Code
- Describe-Blöcke: Component/Hook Name + "Component" oder "Hook"
- Test-Cases: Verhalten in Present-Tense (z.B. "renders button with text")

---

## ✅ Testing Best Practices

### 1. Component Tests

**Was testen?**
- Rendering (erscheint Component korrekt?)
- User-Interaktionen (onClick, onChange, etc.)
- Props (werden Props korrekt verarbeitet?)
- Conditional Rendering (werden Bedingungen korrekt behandelt?)

**Beispiel:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### 2. Hook Tests

**Was testen?**
- Return-Werte
- State-Updates
- Side-Effects (useEffect)
- Error-Handling

**Beispiel-Pattern:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';

describe('useAuth Hook', () => {
  it('provides user data when authenticated', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });
  });
});
```

### 3. Integration Tests

**Was testen?**
- User-Flows (z.B. Login → Dashboard → Create Project)
- API-Interaktionen (Mocking mit MSW)
- Routing
- State-Management

**Hinweis:** Integration Tests sind Teil von **Task 050** (E2E mit Playwright/Cypress).

---

## 🧪 Aktuelle Tests

### ✅ Button Component Tests

**Datei:** `src/components/__tests__/Button.test.tsx`

**Coverage:**
- ✅ Rendering mit Text
- ✅ Click-Events
- ✅ Variant-Klassen
- ✅ Disabled-State
- ✅ AsChild-Prop

### 🚧 TODO: Weitere Tests

Die folgenden Tests sollten noch implementiert werden:

**Hooks:**
- [ ] `useAuth.test.ts` - Auth Context Tests
- [ ] `useCompanies.test.ts` - Companies Query/Mutation Tests
- [ ] `useEmails.test.ts` - Emails Query/Mutation Tests
- [ ] `useOrganizations.test.ts` - Organizations Tests
- [ ] `useProjects.test.ts` - Projects Tests

**Components:**
- [ ] `CompaniesTable.test.tsx` - Companies Table Component
- [ ] `EmailsTable.test.tsx` - Emails Table Component
- [ ] `ProtectedRoute.test.tsx` - Route Guard
- [ ] `LanguageSwitcher.test.tsx` - i18n Switcher

**Forms:**
- [ ] `Auth.test.tsx` - Login/Register Forms
- [ ] `CreateOrganizationDialog.test.tsx` - Organization Creation
- [ ] `CreateProjectDialog.test.tsx` - Project Creation

---

## 📊 Coverage-Ziele

**Mindest-Coverage:**
- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

**Kritische Bereiche (>90% Coverage):**
- Authentication (AuthContext, useAuth)
- RLS-relevante Queries (useCompanies, useProjects, etc.)
- Form-Validierung (Zod Schemas)

---

## 🚀 Tests ausführen

### Alle Tests

```bash
npm run test
```

### Mit UI

```bash
npm run test:ui
```

### Mit Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test -- --watch
```

### Einzelne Datei

```bash
npm run test -- src/components/__tests__/Button.test.tsx
```

---

## 🔍 Debugging

### Vitest UI

Die Vitest UI bietet eine interaktive Oberfläche für Test-Ergebnisse:

```bash
npm run test:ui
```

**Features:**
- Test-Explorer
- Code-Coverage-Visualisierung
- Fehler-Details
- Re-Run einzelner Tests

### Console Logs

Nutze `screen.debug()` für Component-Output:

```typescript
it('renders correctly', () => {
  render(<MyComponent />);
  screen.debug(); // Zeigt HTML-Output in Console
});
```

---

## 🛡️ Mocking

### Supabase Client Mocking

Für Tests, die Supabase nutzen, sollte der Client gemockt werden:

```typescript
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  },
}));
```

### React Query Mocking

Für Tests mit `useQuery`/`useMutation`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

render(<MyComponent />, { wrapper });
```

---

## 📚 Ressourcen

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

---

## ✨ Nächste Schritte

1. **Task 050:** E2E-Tests mit Playwright/Cypress implementieren
2. Kritische User-Flows testen (Login, Project Creation, Workflow Trigger)
3. Coverage-Ziele erreichen (>70%)
4. CI/CD Integration (GitHub Actions für automatische Tests)

---

**Hinweis:** Diese Dokumentation wird fortlaufend aktualisiert, sobald neue Tests hinzugefügt werden.
