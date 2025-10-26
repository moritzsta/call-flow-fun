# User Guide - Cold Calling App

**Version**: 1.0  
**Stand**: 2025-10-26  
**Sprache**: Deutsch

---

## 📖 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Erste Schritte](#erste-schritte)
3. [Organisationen & Projekte](#organisationen--projekte)
4. [Die drei KI-Workflows](#die-drei-ki-workflows)
5. [Firmenverwaltung](#firmenverwaltung)
6. [E-Mail-Management](#e-mail-management)
7. [Team-Kollaboration](#team-kollaboration)
8. [FAQ](#faq)
9. [Support & Kontakt](#support--kontakt)

---

## Übersicht

Die **Cold Calling App** automatisiert den gesamten Kaltakquise-Prozess mit drei KI-gestützten Workflows:

- 🔍 **Finder Felix**: Findet potenzielle Kunden durch Webscraping (Gelbe Seiten)
- 🧠 **Analyse Anna**: Analysiert Firmen-Webseiten mit KI (Firecrawl + GPT)
- ✉️ **Pitch Paul**: Generiert personalisierte Verkaufs-E-Mails (GPT-4)

### Hauptfunktionen

- **Automatisierte Lead-Generierung**: Felix findet Firmen basierend auf Ihren Suchkriterien
- **KI-basierte Analyse**: Anna analysiert Webseiten und erstellt detaillierte Firmenprofile
- **Personalisierte Ansprache**: Paul generiert individuell angepasste E-Mails
- **Team-Kollaboration**: Arbeiten Sie mit Ihrem Team in Organisationen zusammen
- **Projekt-Management**: Organisieren Sie Ihre Kampagnen in übersichtlichen Projekten

---

## Erste Schritte

### 1. Registrierung

1. Öffnen Sie die Landing Page
2. Klicken Sie auf **"Jetzt starten"**
3. Wählen Sie **"Registrieren"**
4. Geben Sie Ihre Daten ein:
   - E-Mail-Adresse
   - Passwort (mindestens 8 Zeichen)
   - Passwort bestätigen
   - Vollständiger Name
5. Klicken Sie auf **"Registrieren"**

> ℹ️ **Hinweis**: Nach der Registrierung werden Sie automatisch eingeloggt. Es ist keine E-Mail-Bestätigung erforderlich.

### 2. Login

1. Öffnen Sie die Login-Seite
2. Geben Sie Ihre E-Mail und Ihr Passwort ein
3. Klicken Sie auf **"Anmelden"**
4. Sie werden zum Dashboard weitergeleitet

### 3. Profil einrichten

Nach dem ersten Login empfehlen wir:

1. Klicken Sie auf Ihr Avatar-Bild (oben rechts)
2. Wählen Sie **"Profil"**
3. Passen Sie Ihre Einstellungen an:
   - Vollständiger Name
   - Avatar-URL (optional)
   - Theme (Hell/Dunkel)
   - Sprache (Deutsch/Englisch)
4. Klicken Sie auf **"Speichern"**

---

## Organisationen & Projekte

### Organisationen erstellen

Organisationen ermöglichen Team-Kollaboration:

1. Navigieren Sie zu **"Organisationen"** in der Sidebar
2. Klicken Sie auf **"+ Neue Organisation"**
3. Geben Sie einen Namen und optional eine Beschreibung ein
4. Klicken Sie auf **"Erstellen"**

> 🎯 **Tipp**: Sie werden automatisch als Owner der Organisation eingetragen.

### Team-Mitglieder einladen

1. Öffnen Sie die Organisations-Übersicht
2. Klicken Sie auf die Organisation
3. Wechseln Sie zum Tab **"Mitglieder"**
4. Klicken Sie auf **"+ Mitglied einladen"**
5. Geben Sie die E-Mail-Adresse des Mitglieds ein
6. Wählen Sie eine Rolle:
   - **Owner**: Volle Kontrolle über Organisation und Projekte
   - **Manager**: Kann Projekte bearbeiten und Workflows starten
   - **Read-Only**: Kann nur Daten einsehen
7. Klicken Sie auf **"Einladen"**

### Projekte erstellen

Projekte sind Container für Ihre Kampagnen:

1. Navigieren Sie zu **"Projekte"**
2. Klicken Sie auf **"+ Neues Projekt"**
3. Wählen Sie die Organisation aus
4. Geben Sie Titel und Beschreibung ein
5. Klicken Sie auf **"Erstellen"**

### Projekt-Dashboard

Das Projekt-Dashboard zeigt:
- **KPI-Cards**: Anzahl der Firmen, E-Mails, Workflows
- **Workflow-Aktionen**: Buttons zum Starten von Felix, Anna, Paul
- **Aktive Workflows**: Realtime-Status der laufenden Workflows

---

## Die drei KI-Workflows

### 🔍 Finder Felix - Firmenfinder

**Zweck**: Findet potenzielle Kunden durch Webscraping der Gelben Seiten.

#### So nutzen Sie Finder Felix:

1. Öffnen Sie Ihr Projekt-Dashboard
2. Klicken Sie auf **"Felix starten"**
3. Geben Sie Ihre Suchkriterien ein:
   - **Suchbegriff** (Pflicht): z.B. "Zahnarzt", "Metallverarbeitung", "Friseursalon"
   - **Bundesland** (optional): z.B. "Bayern", "Nordrhein-Westfalen"
   - **Stadt** (optional): z.B. "München", "Berlin"
   - **Bezirk** (optional): z.B. "Schwabing", "Kreuzberg"
4. Klicken Sie auf **"Felix starten"**

#### Was passiert dann?

1. Felix startet den Webscraping-Prozess
2. Der Workflow-Status wird im Dashboard angezeigt (pending → running → completed)
3. Gefundene Firmen werden automatisch in Ihre Firmen-Liste übernommen
4. Sie erhalten eine Benachrichtigung, wenn Felix fertig ist

#### Limits:

- Suchbegriff: 10-500 Zeichen
- Empfohlene Anzahl: 10-50 Firmen pro Suchlauf

> 💡 **Best Practice**: Starten Sie mit spezifischen Suchbegriffen und engen lokalen Einschränkungen, um qualitativ hochwertige Leads zu erhalten.

---

### 🧠 Analyse Anna - Webseiten-Analyse

**Zweck**: Analysiert Firmen-Webseiten und erstellt detaillierte Profile mit KI.

#### So nutzen Sie Analyse Anna:

1. Öffnen Sie Ihr Projekt-Dashboard
2. Klicken Sie auf **"Anna starten"**
3. Wählen Sie Firmen aus:
   - Klicken Sie auf die Firmen, die analysiert werden sollen
   - Oder wählen Sie über die Checkbox-Spalte
4. Geben Sie Ihren Analyse-Fokus ein (optional):
   - z.B. "Fokussiere auf Digitalisierungs-Bedarf"
   - z.B. "Analysiere Produktpalette und Zielgruppe"
5. Klicken Sie auf **"Anna starten"**

#### Was passiert dann?

1. Anna crawlt die Webseiten mit Firecrawl
2. GPT analysiert den Content und erstellt ein Firmenprofil
3. Die Analyse wird im `analysis`-Feld der Firma gespeichert (JSON)
4. Der Status der Firma ändert sich zu `analyzed`
5. Sie können die Analyse in der Firmen-Detail-Ansicht einsehen

#### Was wird analysiert?

- Geschäftsmodell und Produkte/Dienstleistungen
- Zielgruppe und Marktpositionierung
- Technologie-Stack (falls erkennbar)
- Unternehmensgröße und Struktur
- Potenzielle Pain Points

#### Limits:

- Mindestens 1 Firma muss ausgewählt sein
- Empfohlen: 5-20 Firmen pro Analyse-Lauf

> 💡 **Best Practice**: Geben Sie einen spezifischen Analyse-Fokus an, um noch präzisere Ergebnisse zu erhalten.

---

### ✉️ Pitch Paul - E-Mail-Generator

**Zweck**: Generiert personalisierte Verkaufs-E-Mails basierend auf der Firmen-Analyse.

#### So nutzen Sie Pitch Paul:

1. Öffnen Sie Ihr Projekt-Dashboard
2. Klicken Sie auf **"Paul starten"**
3. Wählen Sie analysierte Firmen aus:
   - Nur Firmen mit Status `analyzed` können ausgewählt werden
   - Klicken Sie auf die gewünschten Firmen
4. Geben Sie Ihr Pitch-Template ein:
   - z.B. "Stelle unser CRM-System vor und betone Zeit-Ersparnis"
   - z.B. "Biete Website-Redesign an mit Fokus auf Mobile-First"
5. Klicken Sie auf **"Paul starten"**

#### Was passiert dann?

1. Paul nutzt die Analyse von Anna als Basis
2. GPT-4 generiert eine personalisierte E-Mail für jede Firma
3. E-Mails werden als `draft` in der E-Mail-Liste gespeichert
4. Sie können die E-Mails vor dem Versand prüfen und bearbeiten

#### Was enthält die E-Mail?

- Personalisierte Anrede (mit CEO-Namen, falls vorhanden)
- Bezug auf die spezifischen Bedürfnisse der Firma (aus der Analyse)
- Ihr Angebot/Lösung passend zur Firma
- Call-to-Action (CTA)

#### Limits:

- Mindestens 1 analysierte Firma muss ausgewählt sein
- Pitch-Template: 10-500 Zeichen

> 💡 **Best Practice**: Formulieren Sie Ihr Pitch-Template so, dass Paul es leicht an die Firma anpassen kann. Vermeiden Sie zu generische Vorlagen.

---

## Firmenverwaltung

### Firmen-Liste anzeigen

1. Öffnen Sie Ihr Projekt
2. Navigieren Sie zu **"Firmen"** im Projekt-Menü
3. Sie sehen eine Tabelle mit allen Firmen:
   - Firmenname
   - Branche
   - Kontaktdaten (E-Mail, Telefon)
   - Status
   - Ort (Stadt, Bundesland)
   - Website
   - Erstellt am

### Firmen filtern

1. Nutzen Sie die **Filter-Leiste** über der Tabelle:
   - **Suche**: Durchsucht Name, Branche, E-Mail
   - **Status**: Filtert nach `found`, `analyzed`, `contacted`, etc.
   - **Bundesland**: Filtert nach Bundesland
   - **Stadt**: Filtert nach Stadt

2. Klicken Sie auf **"Filter zurücksetzen"**, um alle Filter zu entfernen

### Firmen sortieren

- Klicken Sie auf die Spalten-Header, um zu sortieren
- Erneutes Klicken wechselt zwischen aufsteigend und absteigend

### Firmen-Details anzeigen

1. Klicken Sie auf eine Firma in der Tabelle
2. Sie sehen die Detail-Ansicht mit:
   - Basis-Informationen (Name, Branche, CEO, Kontakt)
   - Adresse und Standort
   - Website-Link
   - **Analyse-Daten** (falls vorhanden):
     - Geschäftsmodell
     - Zielgruppe
     - Pain Points
     - etc.

### Firmen-Status

- **found**: Von Felix gefunden, noch nicht analysiert
- **analyzed**: Von Anna analysiert
- **contacted**: E-Mail wurde versendet
- **qualified**: Lead wurde qualifiziert
- **rejected**: Lead wurde aussortiert

---

## E-Mail-Management

### E-Mail-Liste anzeigen

1. Öffnen Sie Ihr Projekt
2. Navigieren Sie zu **"E-Mails"** im Projekt-Menü
3. Sie sehen eine Tabelle mit allen E-Mails:
   - Empfänger (Firma)
   - E-Mail-Adresse
   - Betreff
   - Status
   - Erstellt am
   - Versendet am

### E-Mails filtern

1. Nutzen Sie die **Filter-Leiste**:
   - **Suche**: Durchsucht Empfänger, E-Mail, Betreff
   - **Status**: Filtert nach `draft`, `ready_to_send`, `sent`, `failed`

### Einzelne E-Mail versenden

1. Öffnen Sie die E-Mail-Liste
2. Klicken Sie auf eine E-Mail mit Status `draft` oder `ready_to_send`
3. Prüfen Sie den E-Mail-Inhalt in der Detail-Ansicht
4. Klicken Sie auf **"E-Mail senden"**
5. Bestätigen Sie den Versand im Dialog
6. Der Status wechselt zu `sent`

### Batch-Versand (mehrere E-Mails)

1. Öffnen Sie die E-Mail-Liste
2. Wechseln Sie zum Tab **"Batch-Versand"**
3. Wählen Sie die E-Mails aus:
   - Nur E-Mails mit Status `ready_to_send` können versendet werden
   - Klicken Sie auf die Checkboxen in der Tabelle
4. Klicken Sie auf **"Ausgewählte E-Mails versenden"**
5. Bestätigen Sie den Batch-Versand
6. Eine Progress-Anzeige zeigt den Fortschritt
7. Sie erhalten eine Zusammenfassung: "X von Y E-Mails erfolgreich versendet"

### E-Mail-Status

- **draft**: Von Paul generiert, noch nicht fertig
- **ready_to_send**: Bereit zum Versand
- **sent**: Erfolgreich versendet
- **failed**: Versand fehlgeschlagen

> ⚠️ **Wichtig**: E-Mails mit Status `draft` müssen manuell auf `ready_to_send` gesetzt werden, bevor sie versendet werden können.

---

## Team-Kollaboration

### Rollen und Berechtigungen

#### Owner
- Kann Organisation und Projekte vollständig verwalten
- Kann Mitglieder einladen, entfernen und Rollen ändern
- Kann alle Workflows starten
- Kann Firmen und E-Mails verwalten

#### Manager
- Kann Projekte bearbeiten
- Kann alle Workflows starten
- Kann Firmen und E-Mails verwalten
- Kann keine Mitglieder verwalten

#### Read-Only
- Kann nur Daten einsehen
- Kann keine Änderungen vornehmen
- Kann keine Workflows starten

### Mitglieder verwalten

#### Mitglied hinzufügen

1. Öffnen Sie die Organisations-Einstellungen
2. Wechseln Sie zum Tab **"Mitglieder"**
3. Klicken Sie auf **"+ Mitglied einladen"**
4. Geben Sie die E-Mail-Adresse ein
5. Wählen Sie die Rolle
6. Klicken Sie auf **"Einladen"**

#### Rolle ändern

1. Öffnen Sie die Mitglieder-Liste
2. Wählen Sie ein Mitglied aus
3. Klicken Sie auf das **Rollen-Dropdown**
4. Wählen Sie die neue Rolle
5. Bestätigen Sie die Änderung

#### Mitglied entfernen

1. Öffnen Sie die Mitglieder-Liste
2. Klicken Sie auf das **X** neben dem Mitglied
3. Bestätigen Sie das Entfernen
4. Das Mitglied verliert sofort den Zugriff auf die Organisation

> ⚠️ **Hinweis**: Nur Owners können Mitglieder verwalten.

---

## FAQ

### Allgemeine Fragen

#### Wie lange dauert ein Workflow?

- **Finder Felix**: 2-10 Minuten (abhängig von der Anzahl der Suchergebnisse)
- **Analyse Anna**: 5-20 Minuten (abhängig von der Anzahl der Firmen)
- **Pitch Paul**: 3-15 Minuten (abhängig von der Anzahl der Firmen)

#### Kann ich Workflows abbrechen?

Aktuell können laufende Workflows nicht manuell abgebrochen werden. Sie laufen bis zur Fertigstellung oder schlagen fehl.

#### Was passiert, wenn ein Workflow fehlschlägt?

- Der Status wechselt zu `failed`
- Sie erhalten eine Fehler-Benachrichtigung
- Sie können den Workflow erneut starten

#### Wie viele Firmen kann ich gleichzeitig analysieren?

- **Empfohlen**: 5-20 Firmen pro Analyse-Lauf
- **Maximum**: Technisch unbegrenzt, aber längere Laufzeit

### Datenschutz & Sicherheit

#### Wo werden meine Daten gespeichert?

Alle Daten werden in einer Supabase-Datenbank gespeichert, die auf sicheren EU-Servern gehostet wird.

#### Wer kann meine Daten sehen?

- Nur Mitglieder Ihrer Organisation können Ihre Projektdaten sehen
- Ihre Daten sind durch Row Level Security (RLS) geschützt
- Niemand außerhalb Ihrer Organisation hat Zugriff

#### Werden E-Mails automatisch versendet?

Nein. E-Mails werden **nie** automatisch versendet. Sie müssen jede E-Mail manuell freigeben.

### Technische Fragen

#### Welche Browser werden unterstützt?

- Chrome (empfohlen)
- Firefox
- Safari
- Edge

#### Kann ich die App auf dem Handy nutzen?

Ja, die App ist vollständig responsive und funktioniert auf allen Geräten.

#### Gibt es eine API?

Aktuell gibt es keine öffentliche API. Alle Funktionen sind über die Web-App verfügbar.

### Probleme & Fehlerbehebung

#### Ich kann mich nicht einloggen

1. Überprüfen Sie Ihre E-Mail-Adresse und Ihr Passwort
2. Stellen Sie sicher, dass Ihr Account existiert (registriert)
3. Löschen Sie Ihren Browser-Cache
4. Versuchen Sie es in einem privaten/Inkognito-Fenster

#### Ein Workflow bleibt bei "running" hängen

1. Warten Sie 15-20 Minuten
2. Wenn der Status sich nicht ändert, kontaktieren Sie den Support
3. Sie können den Workflow in einem neuen Projekt erneut starten

#### Firmen werden nicht angezeigt

1. Überprüfen Sie Ihre Filter-Einstellungen
2. Klicken Sie auf "Filter zurücksetzen"
3. Aktualisieren Sie die Seite (F5)
4. Prüfen Sie, ob Workflows erfolgreich abgeschlossen wurden

#### E-Mail-Versand schlägt fehl

Mögliche Gründe:
- Ungültige E-Mail-Adresse
- E-Mail-Server ist nicht erreichbar
- n8n-Workflow ist nicht korrekt konfiguriert
- Kontaktieren Sie den Support

---

## Support & Kontakt

### Benötigen Sie Hilfe?

- **E-Mail**: support@coldcalling.app
- **Dokumentation**: [docs.coldcalling.app](https://docs.coldcalling.app)
- **Status-Page**: [status.coldcalling.app](https://status.coldcalling.app)

### Feedback & Feature-Requests

Wir freuen uns über Ihr Feedback! Senden Sie Ihre Ideen an:
- **E-Mail**: feedback@coldcalling.app
- **GitHub**: [github.com/coldcalling/app/issues](https://github.com/coldcalling/app/issues)

---

**Happy Cold Calling! 🚀**
