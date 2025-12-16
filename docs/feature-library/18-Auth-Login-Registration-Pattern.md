# 18 - Auth Login & Registration Pattern

**Zweck:** Vollständige Login/Registrierungs-Seite mit Supabase Auth, Strong Password Detection, Passwort-Vergessen-Flow und professionellem E-Mail-Template.

**Basis:** AllMyPrompts PromptManager (Production)

---

## 📋 Übersicht

| Feature | Beschreibung |
|---------|-------------|
| **Login/Signup Tabs** | Tab-basierte UI für Anmelden und Registrieren |
| **Strong Password Detection** | Live-Checkliste mit visueller Rückmeldung |
| **Passwort vergessen** | E-Mail mit Reset-Link → Neues Passwort setzen |
| **Eye Toggle** | Passwort anzeigen/verbergen |
| **Zurück zur Startseite** | Navigation für Abbrecher |
| **Error Handling** | Deutsche, nutzerfreundliche Fehlermeldungen |
| **Auto-Redirect** | Eingeloggte User → Dashboard |

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (React)                                                   │
│                                                                     │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │     LoginPage       │  │ ForgotPassword   │  │ ResetPassword  │  │
│  │  ┌───────────────┐  │  │     Page         │  │     Page       │  │
│  │  │ Tab: Anmelden │  │  │                  │  │                │  │
│  │  │ Tab: Regis-   │  │  │  E-Mail Input    │  │  Neues PW      │  │
│  │  │     trieren   │  │  │  → Reset-Link    │  │  + Bestätigung │  │
│  │  └───────────────┘  │  │     senden       │  │                │  │
│  │  + PW-Checklist     │  └────────┬─────────┘  └───────┬────────┘  │
│  │  + Eye Toggle       │           │                    │           │
│  │  + PW vergessen?    │           │                    │           │
│  └──────────┬──────────┘           │                    │           │
│             │                      │                    │           │
│             ▼                      ▼                    ▼           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              SupabaseAuthContext (Provider)                  │   │
│  │  signUp() │ signIn() │ resetPassword() │ updatePassword()    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase Auth                                                      │
│  ┌─────────────────────┐   ┌────────────────────────────────────┐   │
│  │    auth.users       │   │  Password Reset Email Template     │   │
│  │                     │   │  (Konfiguriert in Supabase)        │   │
│  └─────────────────────┘   └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Dateistruktur

```
src/
├── components/
│   └── auth/
│       ├── LoginPage.tsx           # Hauptseite mit Tabs
│       ├── ForgotPasswordPage.tsx  # E-Mail für Reset eingeben
│       └── ResetPasswordPage.tsx   # Neues Passwort setzen
├── contexts/
│   └── SupabaseAuthContext.tsx     # Auth Provider
├── utils/
│   └── passwordValidation.ts       # Zod Schema + Anforderungen
docs/
└── email-templates/
    └── password-reset.html         # E-Mail-Template für Supabase
```

---

## 🔧 Implementation

### 1. Passwort-Validierung (`passwordValidation.ts`)

```typescript
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Passwort muss mindestens 12 Zeichen lang sein')
  .max(72, 'Passwort darf maximal 72 Zeichen lang sein (bcrypt-Limit)')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/\d/, 'Passwort muss mindestens eine Ziffer enthalten')
  .regex(/[^a-zA-Z0-9]/, 'Passwort muss mindestens ein Sonderzeichen enthalten')
  .refine(
    (password) => !/["\\]/.test(password),
    'Passwort darf keine Anführungszeichen (") oder Backslashes (\\) enthalten'
  );

export const emailSchema = z
  .string()
  .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
  .min(1, 'E-Mail ist erforderlich');

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

export const getPasswordRequirements = (password: string): PasswordRequirement[] => [
  {
    label: 'Mindestens 12 Zeichen',
    test: (p) => p.length >= 12,
    met: password.length >= 12,
  },
  {
    label: 'Maximal 72 Zeichen',
    test: (p) => p.length <= 72,
    met: password.length <= 72,
  },
  {
    label: 'Mindestens ein Kleinbuchstabe (a-z)',
    test: (p) => /[a-z]/.test(p),
    met: /[a-z]/.test(password),
  },
  {
    label: 'Mindestens ein Großbuchstabe (A-Z)',
    test: (p) => /[A-Z]/.test(p),
    met: /[A-Z]/.test(password),
  },
  {
    label: 'Mindestens eine Ziffer (0-9)',
    test: (p) => /\d/.test(p),
    met: /\d/.test(password),
  },
  {
    label: 'Mindestens ein Sonderzeichen (!@#$%^&*)',
    test: (p) => /[^a-zA-Z0-9]/.test(p),
    met: /[^a-zA-Z0-9]/.test(password),
  },
  {
    label: 'Keine Anführungszeichen oder Backslashes',
    test: (p) => !/["\\]/.test(p),
    met: !/["\\]/.test(password),
  },
];
```

**Wichtig:**
- **bcrypt-Limit:** Max 72 Zeichen (alles darüber wird abgeschnitten)
- **Sonderzeichen-Einschränkung:** `"` und `\` vermeiden (JSON-Probleme)

---

### 2. LoginPage mit Tabs (`LoginPage.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Mail, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { passwordSchema, emailSchema, getPasswordRequirements } from '@/utils/passwordValidation';

// Nutzerfreundliche Fehlermeldungen
const getAuthErrorMessage = (error: any, isSignUp: boolean): string => {
  const errorMessage = error?.message || '';
  
  // Sign Up spezifische Fehler
  if (isSignUp) {
    if (errorMessage.includes('User already registered')) {
      return 'Diese E-Mail-Adresse ist bereits registriert.';
    }
    if (errorMessage.includes('Password')) {
      return `Passwort-Problem: ${errorMessage}`;
    }
    if (errorMessage.includes('Unable to validate email address')) {
      return 'Die E-Mail-Adresse ist ungültig.';
    }
    if (errorMessage.includes('Email rate limit exceeded')) {
      return 'Zu viele Versuche. Bitte warten Sie.';
    }
  }
  
  // Sign In spezifische Fehler
  if (!isSignUp) {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Ungültige E-Mail oder Passwort.';
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.';
    }
  }
  
  return errorMessage || 'Ein unbekannter Fehler ist aufgetreten.';
};

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { signIn, signUp, user } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auto-Redirect wenn eingeloggt
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({ 
        title: 'Anmeldung fehlgeschlagen', 
        description: getAuthErrorMessage(error, false),
        variant: 'destructive' 
      });
    } else {
      toast({ title: 'Willkommen zurück! 👋', description: 'Erfolgreich angemeldet' });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-seitige Validierung VOR dem API-Call
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err: any) {
      toast({ 
        title: 'Validierungsfehler', 
        description: err.errors?.[0]?.message || 'Validierungsfehler',
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password);
    
    if (error) {
      toast({ 
        title: 'Registrierung fehlgeschlagen', 
        description: getAuthErrorMessage(error, true),
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: 'Erfolg! 🎉', 
        description: 'Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.',
        duration: 6000,
      });
      setEmail('');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Willkommen</CardTitle>
          <CardDescription className="text-center">
            Melden Sie sich an oder erstellen Sie ein Konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(v) => setIsSignUp(v === "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>
            
            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-Mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="ihre@email.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Passwort eingeben"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    {/* Eye Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    Passwort vergessen?
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Anmelden...' : 'Anmelden'}
                </Button>
              </form>
            </TabsContent>
            
            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-Mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="ihre@email.de"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        // Live E-Mail-Validierung
                        try {
                          emailSchema.parse(e.target.value);
                          setEmailError(null);
                        } catch (err: any) {
                          if (e.target.value.length > 0) {
                            setEmailError(err.errors[0]?.message);
                          }
                        }
                      }}
                      className={`pl-10 ${emailError ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" /> {emailError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sicheres Passwort eingeben"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Live Passwort-Checkliste */}
                  {(passwordFocused || password.length > 0) && (
                    <div className="bg-muted/50 border border-border rounded-md p-3 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Passwort-Anforderungen:
                      </p>
                      {getPasswordRequirements(password).map((req, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-xs transition-colors ${
                            req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                          }`}
                        >
                          {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrieren...' : 'Konto erstellen'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* Zurück zur Startseite Link */}
          <div className="mt-4 text-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

### 3. ForgotPasswordPage (`ForgotPasswordPage.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { resetPassword, user } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect wenn eingeloggt
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);
    
    if (error) {
      toast({ 
        title: 'Fehler', 
        description: 'E-Mail konnte nicht gesendet werden', 
        variant: 'destructive' 
      });
    } else {
      setIsEmailSent(true);
      toast({ 
        title: 'E-Mail gesendet', 
        description: 'Überprüfen Sie Ihre E-Mails für den Reset-Link' 
      });
    }

    setIsLoading(false);
  };

  // Erfolgsansicht nach E-Mail-Versand
  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">E-Mail gesendet</CardTitle>
            <CardDescription className="text-center">
              Wir haben Ihnen einen Link zum Zurücksetzen gesendet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Link.
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Anmeldung
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Passwort vergessen?</CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihre E-Mail ein, um einen Reset-Link zu erhalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Senden...' : 'Reset-Link senden'}
            </Button>
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zurück zur Anmeldung
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

### 4. ResetPasswordPage (`ResetPasswordPage.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { updatePassword, session } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Session-Check (aus dem Reset-Link)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
      if (!session) {
        toast({ 
          title: 'Ungültiger Link', 
          description: 'Der Link ist abgelaufen oder ungültig.', 
          variant: 'destructive' 
        });
        navigate('/auth/forgot-password');
      }
    }, 2000); // 2 Sekunden warten bis Session etabliert

    return () => clearTimeout(timer);
  }, [session, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ 
        title: 'Fehler', 
        description: 'Die Passwörter stimmen nicht überein.', 
        variant: 'destructive' 
      });
      return;
    }

    if (password.length < 12) {
      toast({ 
        title: 'Fehler', 
        description: 'Passwort muss mindestens 12 Zeichen lang sein.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsLoading(true);

    const { error } = await updatePassword(password);
    
    if (error) {
      toast({ 
        title: 'Fehler', 
        description: 'Passwort konnte nicht aktualisiert werden.', 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: 'Erfolg', 
        description: 'Ihr Passwort wurde aktualisiert.' 
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  // Loading während Session-Check
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Link wird überprüft...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Neues Passwort</CardTitle>
          <CardDescription className="text-center">
            Geben Sie Ihr neues Passwort ein
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Neues Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={12}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Passwort bestätigen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  minLength={12}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Speichern...' : 'Passwort speichern'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

### 5. AuthContext (`SupabaseAuthContext.tsx`)

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auth State Listener ZUERST einrichten
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // DANN bestehende Session prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/auth/confirm`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user, session, signUp, signIn, signOut, resetPassword, updatePassword, isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### 6. Routes Setup (`App.tsx`)

```tsx
import { LoginPage } from '@/components/auth/LoginPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage';

// In deinem Router:
<Route path="/login" element={<LoginPage />} />
<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/auth/reset-password" element={<ResetPasswordPage />} />
```

---

### 7. E-Mail-Template (`password-reset.html`)

In Supabase unter **Authentication > Email Templates > Reset Password** einfügen:

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Passwort zurücksetzen</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, sans-serif; background-color: #f4f4f5;">
    <table style="width: 100%; background-color: #f4f4f5;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px 8px 0 0;">
                            <span style="font-size: 40px;">🔑</span>
                            <h1 style="color: #ffffff; font-size: 28px;">Passwort zurücksetzen</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
                            
                            <!-- Reset Button -->
                            <table style="width: 100%; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                                            Passwort zurücksetzen
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info -->
                            <div style="background-color: #f4f4f5; padding: 16px; border-left: 4px solid #667eea; border-radius: 4px;">
                                ⏱️ <strong>Wichtig:</strong> Dieser Link ist nur für <strong>1 Stunde</strong> gültig.
                            </div>

                            <!-- Warning -->
                            <div style="background-color: #fef2f2; padding: 16px; border-left: 4px solid #ef4444; border-radius: 4px; margin-top: 20px;">
                                ⚠️ <strong>Du hast diese Anfrage nicht gestellt?</strong><br>
                                Ignoriere diese E-Mail. Dein Passwort bleibt unverändert.
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #fafafa; text-align: center; border-top: 1px solid #e4e4e7; border-radius: 0 0 8px 8px;">
                            <strong>Deine App</strong><br>
                            <small>Diese E-Mail wurde automatisch generiert.</small>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## ✅ Best Practices

### Security
- **bcrypt-Limit:** Max 72 Zeichen (längere Passwörter werden abgeschnitten)
- **Zod-Validierung:** Auf Client UND Server
- **Keine sensiblen Daten in Console.log** (Production)
- **Rate Limiting:** Von Supabase automatisch

### UX
- **Live-Feedback:** Passwort-Checkliste zeigt sofort, was fehlt
- **Eye Toggle:** User können Passwort prüfen
- **Klare Fehlermeldungen:** Deutsche, verständliche Texte
- **Auto-Redirect:** Eingeloggte User kommen direkt zum Dashboard

### i18n
- Fehlermeldungen in der App-Sprache
- E-Mail-Template in Kundensprache

---

## 📋 Checkliste

- [ ] `passwordValidation.ts` mit Zod-Schema erstellen
- [ ] `LoginPage.tsx` mit Tabs implementieren
- [ ] `ForgotPasswordPage.tsx` erstellen
- [ ] `ResetPasswordPage.tsx` erstellen
- [ ] `SupabaseAuthContext.tsx` erweitern
- [ ] Routes in `App.tsx` einrichten
- [ ] E-Mail-Template in Supabase konfigurieren
- [ ] **Supabase URL Configuration prüfen:**
  - Site URL → `https://deine-app.de`
  - Redirect URLs → `https://deine-app.de/auth/reset-password`

---

## 🔗 Verwandte Pattern

- **[01-Auth-Profile-Pattern](./01-Auth-Profile-Pattern.md):** Erweiterte Profile-Tabelle
- **[03-Security-Pattern](./03-Security-Pattern.md):** RLS Policies für User-Daten
- **[14-Transactional-Email-Pattern](./14-Transactional-Email-Pattern.md):** Custom E-Mail-Templates

---

**Version:** 1.0  
**Stand:** 2025-01-16  
**Basis:** AllMyPrompts PromptManager (Production)
