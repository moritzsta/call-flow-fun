# SOFTWARE_DOKU.md

## 1. Einleitung & Überblick

### Zweck & Zielgruppe
Dieses Dokument dient als technische Referenz und Leitfaden für die Entwicklung, Wartung und Erweiterung des "Cold Calling"-Projekts. Die primäre Zielgruppe sind Entwickler, Software-Architekten, DevOps-Ingenieure, Tester und Stakeholder, die ein tiefes Verständnis der Systemarchitektur und Implementierungsdetails benötigen. Es soll eine gemeinsame Basis für alle Beteiligten schaffen und die Einhaltung der technischen Standards gewährleisten.

### Projektzusammenfassung
Das "Cold Calling" Projekt zielt darauf ab, den Prozess der Kaltaquise im Sales-Bereich für Einzelpersonen und Teams zu vereinfachen und zu beschleunigen. Es automatisiert die Identifizierung potenzieller Kunden, die Analyse relevanter Unternehmensdaten und die Generierung personalisierter Ansprachen (E-Mails) mittels KI. Die Anwendung bietet eine intuitive, browserbasierte Oberfläche für die Interaktion mit den automatisierten Workflows und die Verwaltung der Sales-Prozesse.

**Hauptziele:**
*   **Effizienzsteigerung:** Automatisierung zeitraubender Schritte in der Kaltaquise.
*   **Personalisierung:** Bereitstellung kontextsensitiver E-Mails für höhere Erfolgsquoten.
*   **Team-Kollaboration:** Ermöglichung gemeinsamer Sales-Prozesse innerhalb von Organisationen.
*   **Skalierbarkeit:** Unterstützung einer großen Anzahl von Unternehmen und Mitarbeitern.

**Scope:**
Das Projekt umfasst die Entwicklung eines Lovable-Frontend (React, Vite, Tailwind), die Anbindung an eine Supabase-Datenbank und die Integration mit drei n8n-Workflows ("Finder Felix", "Analyse Anna", "Pitch Paul") über Webhooks. Es beinhaltet Benutzerauthentifizierung, Rollenmanagement, Organisationsverwaltung, Projektmanagement und die Workflow-gesteuerte Interaktion mit KI-Agenten zur Datenerfassung, -analyse und E-Mail-Generierung.

### Dokumentenstruktur-Übersicht
Dieses Dokument ist in zehn Hauptabschnitte unterteilt, die von einem High-Level-Überblick bis zu detaillierten Implementierungsaspekten reichen. Es beginnt mit einer allgemeinen Einführung, geht dann in die Systemarchitektur über, beschreibt Datenmodelle, Schnittstellen, Komponenten und UI/UX-Design. Abschließend werden Anforderungen, Annahmen, Abhängigkeiten, ein Glossar sowie Implementierungs- und Deployment-Strategien dargestellt.

## 2. Systemarchitektur

### High-Level Architektur-Beschreibung
Die Architektur des "Cold Calling"-Projekts folgt einem modernen, cloud-nativen Ansatz. Sie basiert auf einem Frontend, einem Backend-as-a-Service (BaaS) und einer Integration zu einer Workflow-Automatisierungsplattform.

1.  **Client (Frontend):** Eine Single-Page Application (SPA), entwickelt mit Lovable (React, Vite, Tailwind), die die Benutzeroberfläche bereitstellt und mit Supabase sowie n8n interagiert.
2.  **BaaS (Supabase):** Dient als primäres Backend für Authentifizierung, Echtzeit-Datenbank (PostgreSQL), Dateispeicherung und Serverless-Funktionen.
3.  **Workflow-Automatisierung (n8n):** Drei dedizierte Workflows orchestrieren die KI-gestützte Datenbeschaffung, -analyse und E-Mail-Generierung. Sie sind über Webhooks mit dem Frontend verbunden.

Diese Trennung ermöglicht eine hohe Skalierbarkeit, Flexibilität und klare Verantwortlichkeiten zwischen den Systemkomponenten.

```
+-------------------+       +--------------------+       +----------------------------+
|                   |       |                    |       |                            |
|    Lovable UI     |<----->|     Supabase       |<----->|         n8n Workflows      |
| (React, Vite, TL) |       | (Auth, DB, Storage)|       | (Finder Felix, Anna, Paul) |
|                   |       |                    |       |                            |
+-------------------+       +--------------------+       +----------------------------+
       ^      ^                         ^
       |      |                         |
       |      +-------------------------+ (JWT/API Keys for Auth)
       +----------------------------------(Webhooks for Workflow Triggering)
```

### Komponentenbeschreibung

*   **Frontend (Lovable UI):**
    *   Stack: React, Vite, Tailwind CSS.
    *   Kernaufgabe: Darstellung der Benutzeroberfläche, Benutzerinteraktion, Verwaltung des lokalen Anwendungszustands.
    *   Kommunikation: Direkte Interaktion mit Supabase für Datenzugriff und Authentifizierung. Triggerung der n8n-Workflows über Webhooks.
*   **Backend / BaaS (Supabase):**
    *   **Supabase Auth:** Benutzerregistrierung, Login, Rollenmanagement, Session-Verwaltung (Feature Library → 01-Auth-Profile-Pattern.md).
    *   **Supabase PostgreSQL Database:** Persistenzschicht für alle Anwendungsdaten (Benutzerprofile, Organisationen, Projekte, Firmendaten, E-Mails, etc.). Nutzung von Row Level Security (RLS) für datenschutzkonforme Zugriffssteuerung (Feature Library → 03-Security-Pattern.md).
    *   **Supabase Edge Functions:** Potenzielle Nutzung für kleine, performanzkritische Backend-Logik, die nicht in n8n abgebildet werden soll oder direkt mit der Datenbank interagiert. Könnte auch als Proxy für n8n-Webhooks dienen, um zusätzliche Sicherheitsebenen hinzuzufügen.
*   **Workflow-Automatisierung (n8n):**
    *   **Finder Felix:** Webscraping und Datenenrichment für Firmendaten basierend auf Orts- und Branchenkriterien. Schreibt Daten in die `german_companies`-Tabelle. Wird per Freitext-Anfrage über Webhook getriggert.
    *   **Analyse Anna:** KI-basierte Webseitenanalyse von Unternehmens-Websites via Firecrawl & KI. Erweitert das `analysis`-Feld in der `german_companies`-Tabelle. Wird per Freitext-Anfrage über Webhook getriggert.
    *   **Pitch Paul:** KI-gestützte Generierung personalisierter Cold-E-Mails basierend auf den Daten von Felix und Anna. Speichert E-Mails in einer dedizierten `project_emails`-Tabelle. Wird per Freitext-Anfrage über Webhook getriggert.
    *   **E-Mail-Versand-Workflow:** Ein neu aufgeteilter Workflow, der ausschließlich für den Versand generierter E-Mails zuständig ist. Dieser wird manuell oder im Batch vom Frontend getriggert.
*   **Externe Dienste:**
    *   KI-Modelle (über n8n integriert): Für Textanalyse und -generierung.
    *   Webscraping-Dienste (über n8n integriert): Für die Datenerfassung durch Finder Felix.

### Architektonische Entscheidungen

*   **Technologie-Choices:**
    *   **Frontend: Lovable (React, Vite, Tailwind):** Gewählt aufgrund der Expertise des Kunden und der Entwicklerfreundlichkeit, modernem Tooling und leistungsstarkem UI-Framework.
    *   **BaaS: Supabase:** Umfassende Plattform für Authentifizierung, Datenbank (PostgreSQL), Dateispeicherung und Echtzeit-Funktionalitäten. Reduziert den Bedarf an einem Custom-Backend erheblich.
    *   **Workflow-Automatisierung: n8n:** Flexibles und leistungsfähiges Tool zur Orchestrierung komplexer Workflows, insbesondere für KI-Interaktionen und externe API-Anbindungen. Die Möglichkeit zur Aktualisierung der n8n-Version wird genutzt, um die Integration zu optimieren.
*   **Design Patterns:**
    *   **Micro-Frontend (im übertragenen Sinne):** Klare Trennung von Frontend, BaaS und Workflow-Ebene.
    *   **CQRS (Command Query Responsibility Segregation):** Das Frontend sendet "Befehle" (z.B. Trigger-Anfragen an n8n) und "Abfragen" (Daten von Supabase).
    *   **Event-Driven Architecture (für n8n-Interaktionen):** Die Kommunikation mit n8n erfolgt asynchron über Webhooks, was eine lose Kopplung ermöglicht und die Wartbarkeit verbessert.
*   **Skalierbarkeit:**
    *   **Supabase:** Skaliert automatisch mit der Nutzung, da es auf PostgreSQL und Cloud-Infrastruktur basiert.
    *   **n8n:** Kann horizontal skaliert werden, indem weitere Instanzen hinzugefügt werden, oder vertikal durch stärkere Maschinen. Die asynchrone Verarbeitung entkoppelt die Last vom Frontend.
    *   **Frontend:** React-SPAs sind grundsätzlich gut skalierbar und können über CDNs weltweit effizient ausgeliefert werden.
*   **Performance:**
    *   **Optimierter Datenzugriff:** Einsatz von Supabase Realtime für Updates, effiziente SQL-Abfragen, Indizes.
    *   **Asynchrone Workflows:** Lange laufende KI-Prozesse werden in n8n ausgelagert und im Hintergrund verarbeitet, um das Frontend reaktionsfähig zu halten. Benachrichtigungen und Status-Updates erfolgen über Supabase Realtime oder Polling.
    *   **Caching:** Frontend-seitiges Caching und Supabase-Caching (teilweise automatisch) zur Reduzierung von Latenzen.
*   **Sicherheit:**
    *   **Supabase Row Level Security (RLS):** Konsequenter Einsatz von RLS für alle Datenbanktabellen, insbesondere für projektspezifische Daten und sensible Informationen (Feature Library → 03-Security-Pattern.md).
    *   **JWT-Authentifizierung:** Sicherstellung der Benutzeridentität und -autorisierung über Supabase Auth.
    *   **Webhooks mit Signature Verification:** Implementierung von Signature Verification für n8n-Webhooks, um sicherzustellen, dass Anfragen tatsächlich von n8n stammen.

## 3. Daten- & Datenmodell-Design

### Datenbankstruktur (Supabase PostgreSQL)

Alle Datenbanken werden durch Supabase verwaltet. Die genaue Schemadefinition der `project_companies` und `project_emails` Tabellen wird die Anforderungen an Projektisolation und Performance berücksichtigen. Eine Diskussion, ob pro Projekt eine separate Tabelle oder eine Mastertabelle mit `project_id` Spalte verwendet wird, ist erforderlich. Angesichts der **Anforderung, dass jedes Projekt nur Zugriff auf seine eigenen Daten haben soll**, ist eine Kombination aus `project_id` in einer Mastertabelle mit strikten RLS-Policies die empfehlenswerte Lösung, da sie weniger Management-Overhead verursacht als Dutzende separater Tabellen.

**Bestehende Tabellen:**
*   `german_districts`: `id`, `state`, `city`, `district`, `created_at` (vollständig gefüllt)
*   `german_citys`: `id`, `state`, `city`, `created_at` (vollständig gefüllt)

**Neue/Erweiterte Tabellen:**

1.  **`users`:** (Automatisch durch Supabase Auth, erweitert durch Profilfelder)
    *   `id` (UUID, PK) - Referenziert `auth.users.id`
    *   `email` (Text)
    *   `preferred_language` (Text, z.B. 'de', 'en')
    *   `theme` (Text, 'light', 'dark')
    *   `created_at`, `updated_at` (Timestamps)
    *   *Feature Library → 01-Auth-Profile-Pattern.md*

2.  **`organizations`:**
    *   `id` (UUID, PK)
    *   `name` (Text)
    *   `description` (Text)
    *   `owner_id` (UUID, FK zu `users.id`)
    *   `created_at`, `updated_at` (Timestamps)

3.  **`organization_members`:** (Many-to-Many zwischen `organizations` und `users`)
    *   `id` (UUID, PK)
    *   `organization_id` (UUID, FK zu `organizations.id`)
    *   `user_id` (UUID, FK zu `users.id`)
    *   `role` (Enum: 'owner', 'manager', 'read_only')
    *   `created_at`, `updated_at` (Timestamps)

4.  **`projects`:**
    *   `id` (UUID, PK)
    *   `organization_id` (UUID, FK zu `organizations.id`)
    *   `title` (Text)
    *   `description` (Text)
    *   `archived` (Boolean, Standard: false)
    *   `created_at`, `updated_at` (Timestamps)

5.  **`companies`:** (Wird pro Projekt mit einer `project_id` verwaltet, um Isolation zu gewährleisten)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK zu `projects.id`)
    *   `company` (Text)
    *   `industry` (Text)
    *   `ceo_name` (Text, optional)
    *   `phone` (Text, optional)
    *   `email` (Text, optional)
    *   `website` (Text, optional)
    *   `address` (Text, optional)
    *   `district` (Text, FK zu `german_districts.district`, optional)
    *   `city` (Text, FK zu `german_citys.city`, optional)
    *   `state` (Text, zu `german_citys.state`, optional)
    *   `analysis` (JSONB, für detaillierte Analyseergebnisse von Analyse Anna)
    *   `status` (Enum: 'found', 'analyzed', 'contacted', etc., für Workflow-Schritte)
    *   `created_at`, `updated_at` (Timestamps)

6.  **`project_emails`:** (Speichert generierte und gesendete E-Mails pro Projekt)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK zu `projects.id`)
    *   `company_id` (UUID, FK zu `companies.id`)
    *   `recipient_email` (Text)
    *   `subject` (Text)
    *   `body` (Text, Rich-Text-Inhalt)
    *   `status` (Enum: 'draft', 'ready_to_send', 'sent', 'failed')
    *   `sent_at` (Timestamp, wann die E-Mail tatsächlich versendet wurde)
    *   `created_at`, `updated_at` (Timestamps)

7.  **`n8n_workflow_states`:** (Optional, für persistenten Status von Workflows)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK zu `projects.id`)
    *   `workflow_name` (Text: 'finder_felix', 'analyse_anna', 'pitch_paul')
    *   `status` (Enum: 'pending', 'running', 'completed', 'failed')
    *   `trigger_data` (JSONB, ursprüngliche Anfrage, z.B. Freitext)
    *   `result_summary` (JSONB, Zusammenfassung des Workflows)
    *   `started_at`, `completed_at` (Timestamps)
    *   `user_id` (UUID, FK zu `users.id`, wer den Workflow gestartet hat)
    *   *Dies ermöglicht es, den Status von KI-Prozessen auch nach Seitenwechsel/Reload zu verfolgen.*

### Datenmodelle & Entities
*   **User:** Repräsentiert einen registrierten Benutzer mit Profilinformationen.
*   **Organization:** Eine Einheit, die mehrere Benutzer und Projekte zusammenfasst. Basis für Team-Kollaboration.
*   **Project:** Ein einzelner Sales-Vorgang innerhalb einer Organisation, welcher eigene Unternehmens- und E-Mail-Daten verwaltet.
*   **Company:** Ein Datensatz eines potenziellen Kunden inklusive aller gesammelten Informationen und Analyseergebnisse.
*   **ProjectEmail:** Eine von Pitch Paul generierte und potenziell zu versendende E-Mail.

### Sicherheits- & Zugriffskonzepte
*   **Supabase Row Level Security (RLS):** Essentiell für den Datenschutz und die Trennung von Datenbeständen.
    *   **Projekte/Organisationen:** RLS-Policies stellen sicher, dass Benutzer nur auf Projekte und deren zugehörige `companies` und `project_emails` zugreifen können, denen ihre `organization_members.user_id` zugeordnet ist und deren `role` entsprechende Rechte erlaubt.
    *   **Rollenbasierte Zugriffskontrolle (RBAC):**
        *   **Owner:** Volle CRUD-Rechte auf Organisationseinstellungen, Projektverwaltung (inkl. Löschen), Workflow-Triggerung, Datenbearbeitung, E-Mail-Versand.
        *   **Manager:** Volle CRUD-Rechte innerhalb von Projekten (Workflow-Triggerung, Datenbearbeitung, E-Mail-Versand), aber keine administrativen Rechte auf Organisationsebene (kein Löschen von Org., kein Hinzufügen von Mitgliedern).
        *   **Read-Only:** Nur Lesezugriff auf Projekte und deren Daten. Keine Möglichkeit zum Bearbeiten, Löschen oder Triggering von Workflows.
*   **Datenschutz:** Alle persönlichen Daten werden gemäß der DSGVO behandelt. Supabase Auth sorgt für sichere User-Management. Sensible Daten (wie API-Keys für n8n) werden nicht direkt im Frontend gespeichert, sondern über Supabase Edge Functions oder n8n selbst verwaltet.
*   **Audit Trails:** Über die `created_at` und `updated_at` Spalten können Änderungen nachvollzogen werden. Bei kritischeren Aktionen könnten spezielle Audit-Tabellen notwendig sein.

### Datenflüsse & Performance
*   **Kritische Flows:**
    1.  **User-Login/Registrierung:** Supabase Auth.
    2.  **Organisation/Projekt-Erstellung:** Frontend -> Supabase.
    3.  **Workflow-Triggerung:** Frontend sendet POST-Request an n8n-Webhook mit `project_id` und User-Input. n8n verarbeitet, schreibt Ergebnisse asynchron in Supabase.
    4.  **Datenanzeige:** Frontend liest Daten direkt von Supabase.
    5.  **E-Mail-Versand:** Frontend triggert spezifischen n8n-Webhook mit `project_email_id`. n8n versendet, aktualisiert Status in Supabase.
*   **Optimierungen:**
    *   **Indizes:** Auf allen Foreign Keys und häufig abgefragten Spalten (z.B. `project_id`, `company_name`).
    *   **Infinite Scrolling:** Für Listen mit vielen Einträgen, um die Initialladezeit zu minimieren.
    *   **Debouncing/Throttling:** Bei Suchfeldern/Eingaben, die n8n triggern könnten.
    *   **Supabase Realtime:** Einsatz für Status-Updates von n8n-Workflows, um den User in Echtzeit über den Fortschritt zu informieren.
*   **Caching:** Frontend-seitiges Caching von Organisations- und Projektdaten, die sich selten ändern.
*   **Backup:** Supabase bietet automatische Backup-Lösungen.

## 4. Schnittstellen (Interface Design)

### API-Endpunkte

*   **Supabase Client-Side SDK:** Die Lovable-Anwendung nutzt das Supabase JavaScript SDK zur direkten Interaktion mit der Datenbank und der Authentifizierung. Dies umfasst:
    *   Authentifizierungs-Endpunkte (Login, Registrierung, Passwort-Reset)
    *   CRUD-Operationen für Benutzerprofile, Organisationen, Projekte, Teammitglieder, Firmen und E-Mails.
    *   Realtime-API für Status-Updates (z.B. `n8n_workflow_states`).
*   **n8n Webhooks:**
    *   `/webhook/finder-felix`: POST-Endpunkt zum Starten des "Finder Felix"-Workflows. Erwartet `user_input` (Freitext), `project_id`, `user_id`. Gibt eine Bestätigung zurück (z.B. `workflow_id`).
    *   `/webhook/analyse-anna`: POST-Endpunkt zum Starten des "Analyse Anna"-Workflows. Erwartet `user_input` (Freitext), `project_id`, `user_id`. Gibt eine Bestätigung zurück (z.B. `workflow_id`).
    *   `/webhook/pitch-paul-generate`: POST-Endpunkt zum Starten des "Pitch Paul"-Workflows. Erwartet `user_input` (Freitext), `project_id`, `preselected_company_ids` (optional), `user_id`. Gibt eine Bestätigung zurück (z.B. `workflow_id`).
    *   `/webhook/email-sender`: POST-Endpunkt zum Versenden einer einzelnen E-Mail. Erwartet `project_email_id`, `user_id`.
    *   `/webhook/email-sender-batch`: POST-Endpunkt zum Versenden mehrerer E-Mails. Erwartet `project_id`, `email_ids[]`, `user_id`.

### Externe Integrationen
*   **n8n:** Die n8n-Workflows selbst nutzen verschiedene interne und externe Integrationen:
    *   Webscraping-Module (für Finder Felix)
    *   KI-Modelle (OpenAI, andere LLMs via n8n-Nodes) für Analyse Anna und Pitch Paul.
    *   E-Mail-Dienste (SMTP, Sendgrid, etc. via n8n-Nodes) für den E-Mail-Versand-Workflow.
    *   Firecrawl (für Analyse Anna).

### Sicherheit & Authentifizierung
*   **Supabase JWT:** Alle Anfragen von Lovable an Supabase werden mit einem JSON Web Token (JWT) authentifiziert, das der Benutzer nach erfolgreichem Login erhält.
*   **n8n Webhook-Sicherheit:**
    *   **Secret-Schlüssel:** Jeder n8n-Webhook wird mit einem Secret-Schlüssel konfiguriert. Das Frontend übermittelt diesen Schlüssel (oder eine signierte Anfrage) mit jedem Request.
    *   **IP-Whitelist (optional):** Beschränkung der eingehenden Webhook-Anfragen auf bekannte IP-Adressen der Lovable-Anwendung.
    *   **Rate Limiting:** Schutz vor missbräuchlicher Nutzung der Webhooks.
*   **CORS:** Entwicklungsumgebung und Produktionsdomain müssen für CORS in Supabase und n8n konfiguriert werden.

### Error Handling & Monitoring
*   **Error Codes:** Standardisierte HTTP-Statuscodes und benutzerdefinierte Fehlercodes für API-Antworten.
*   **Logging:** Umfassendes Logging in n8n für Workflow-Ausführungen. Server-side Logging bei Supabase Edge Functions. Frontend-Logging für Client-Fehler.
*   **Monitoring:** Einsatz von Supabase Monitoring-Tools für Datenbank-Performance und Auth-Events. n8n stellt eigene Monitoring-Dashboards bereit.
*   **API-Dokumentation:** Interne Dokumentation der n8n-Webhook-Endpunkte, deren erwartete Payloads und Rückgabeformate.

## 5. Komponentendesign

### Frontend-Komponenten (Lovable UI)
*   **Seiten (Pages):**
    *   Login/Registrierung
    *   Dashboard (Übersicht der ausgewählten Organisation und Projekte)
    *   Organisationsverwaltung (Erstellung, Bearbeitung, Mitgliederverwaltung)
    *   Projekteinstellungen (Titel, Beschreibung, Archivierung/Löschen)
    *   Sales-Workflow-Schritte:
        *   Unternehmen finden (mit Chat-Interaktion und Ergebnisliste)
        *   Unternehmen analysieren (mit Chat-Interaktion und Ergebnisliste/Detailansicht)
        *   Unternehmen kontaktieren (mit Chat-Interaktion, E-Mail-Liste und Versandoptionen)
*   **UI-Komponenten:**
    *   **Navigation:** Top Bar (Org-Dropdown, Profilmenü), Left Sidebar (Projektliste, Org-Wechsel).
    *   **Formularelemente:** Textfelder, Selects (Sprache, Theme), Buttons.
    *   **Listen/Tabellen:** Für `companies` und `project_emails`, mit Sortier-, Filter- und Paginierungs-/Infinite-Scrolling-Funktionalität. Editierbare Zellen/Rows.
    *   **Modals:** Für Bestätigungsfragen (z.B. E-Mail-Batch-Versand), Organisationerstellung, Projekteinstellungen.
    *   **Chat-Komponenten:** Aufklappbare Chat-Box für n8n-Interaktion.
    *   **Indikatoren:** Ladeanimationen, Fortschrittsbalken, Status-Icons (für E-Mails 'gesendet' Status).
    *   **Rich-Text-Editor:** Für die Bearbeitung von E-Mail-Inhalten.
    *   **Fehler- und Benachrichtigungs-Toasts.**
*   **Layouts:**
    *   **Auth_Layout:** Für Login/Registrierung.
    *   **Dashboard_Layout:** Für alle Hauptansichten mit Top-Bar und Side-Nav.
*   **Forms:** Formulare für die Erstellung/Bearbeitung von Organisationen, Projekten und Profileinstellungen. Einsatz einer Formular-Bibliothek (z.B. React Hook Form) zur Validierung.

### Backend-Komponenten (n8n Workflows)
*   Die drei Haupt-Workflows (`Finder Felix`, `Analyse Anna`, `Pitch Paul`) sind das Herzstück des Backends und nutzen eine Kombination aus:
    *   **Webhook-Nodes:** Für den Empfang von Anfragen vom Frontend.
    *   **Code-Nodes:** Für die Text-Verarbeitung der Freitexteingaben, ggf. für komplexere Logiken zur Datenformatierung oder für n8n-interne Aufrufe.
    *   **HTTP-Request-Nodes:** Zur Interaktion mit externen Diensten (Firecrawl, KI-APIs).
    *   **Database-Nodes:** Zur Interaktion mit Supabase (PostgreSQL-Nodes) zum Lesen und Schreiben von Daten.
    *   **Conditional-Nodes:** Für Logikverzweigungen basierend auf Analyseergebnissen oder User-Input.
    *   **E-Mail-Nodes:** Für den Versand von E-Mails im dedizierten E-Mail-Versand-Workflow.
    *   **KI-Nodes:** Für die eigentliche KI-Interaktion (z.B. OpenAI-Node) für Analyse Anna und Pitch Paul.

### State Management
*   **Client-State:** Für UI-spezifische Zustände, Formular-Inhalte, Navigationsstatus. Nutzung von React Context API oder einer State-Management-Bibliothek wie Zustand/Jotai.
*   **Server-State:** Langfristige Daten (Organisationen, Projekte, Firmen, E-Mails). Verwaltung über Supabase SDK und React Query/SWR für Caching und Synchronisation.
*   **Sessions:** Über Supabase Auth verwaltet für die Benutzerauthentifizierung und -autorisierung. Der JWT wird browserseitig sicher gespeichert (z.B. httponly cookies).
*   **Caching:** React Query/SWR für optimiertes Daten-Caching und Revalidierung der Daten vom Server-State.

### Custom Hooks & Utilities
*   **Auth Hooks:** Für den einfachen Zugriff auf Benutzerinformationen und den Authentifizierungsstatus.
*   **Data Hooks:** Für den Datenzugriff auf Supabase (z.B. `useOrganizations`, `useProjects`, `useCompanies`).
*   **n8n-Integration Hooks:** Für das Senden von Anfragen an n8n (z.B. `useTriggerFinderFelix`).
*   **Form Validation Utilities:** Für die clientseitige Validierung von Formularen.
*   **i18n Utilities:** Für den Sprachwechsel und die Übersetzung von Texten in Echtzeit.
*   **Theme Switcher Utility:** Für den Wechsel zwischen Hell-/Dunkelmodus.

## 6. Benutzeroberfläche (UI/UX Design)

### Design System
*   **Color Palette:** Fokus auf einen "Sales-Website"-Look – professionell, vertrauenswürdig, aber ansprechend und modern. Kräftige Akzentfarben, die ins Auge fallen. Keine spezifischen Vorgaben, daher wird ein passendes Schema gewählt, das Dynamik und Seriosität vereint.
*   **Typography:** Saubere, gut lesbare Schriftarten, die Professionalität vermitteln. Ohne spezifische Vorgaben wird ein ausgewogenes Paar aus Überschriften- und Textschriftarten gewählt.
*   **Spacing:** Konsistente Abstände zur Verbesserung der Lesbarkeit und visuellen Hierarchie.
*   **Component Library:** Tailwind CSS und ggf. eine shadcn/ui-ähnliche Sammlung von UI-Komponenten zur Sicherstellung der Konsistenz und schnellen Entwicklung.
*   **Icons:** Ein passendes Icon-Set (z.B. Heroicons, Lucide) wird gewählt, das zum Sales-Thema passt und die Funktionalität klar kommuniziert. Sie sollen modern, farbig und "emailmäßig" sein, wie gewünscht.

### User Flows
**Primäre Journeys:**
1.  **Onboarding:** Registrierung (E-Mail/Passwort) → Login → Erstes Dashboard mit leerer Organisation oder Aufforderung zur Erstellung.
2.  **Organisationsmanagement:** Erstellen/Wechseln/Verwalten von Organisationen, Hinzufügen von Teammitgliedern per E-Mail-Einladung.
3.  **Projektmanagement:** Erstellen/Löschen/Bearbeiten von Sales-Projekten.
4.  **Kaltaquise-Workflow:**
    *   **Unternehmen Finden:** Freitext-Eingabe → n8n-Trigger → Lade-Indikator → Anzeige der Ergebnisse (infinite scrolling) → Bearbeitung der Einträge.
    *   **Unternehmen Analysieren:** Freitext-Eingabe → n8n-Trigger → Lade-Indikator → Anzeige der Detailanalyse (expandable/Modal).
    *   **Unternehmen Kontaktieren:** Freitext-Eingabe → n8n-Trigger → Lade-Indikator → Anzeige der generierten E-Mails (Rich-Text-Editor) → Manuelles Senden / Batch-Senden → Status-Update.

**Auth Flow:** Standardmäßiger Supabase Auth (E-Mail/Passwort) mit sicherer Session-Verwaltung.
**Error States:** Klare Fehlermeldungen für ungültige Eingaben, fehlgeschlagene API-Anfragen oder Workflow-Fehler. Visuelle Indikatoren und Toasts.
**Mobile:** Responsive Design über Tailwind CSS, um die Anwendung auf verschiedenen Bildschirmgrößen nutzbar zu machen.

### Accessibility & Standards
*   **WCAG:** Grundlegende WCAG-Richtlinien werden berücksichtigt (z.B. Kontrastverhältnisse, Tastaturnavigation).
*   **i18n (Internationalisierung):** Unterstützung für Deutsch und Englisch in Echtzeit. Alle UI-Texte und dynamischen Inhalte werden über ein i18n-System verwaltet.
*   **Keyboard Navigation:** Sicherstellung der vollständigen Bedienbarkeit mittels Tastatur.
*   **Screen Reader Support:** Semantisches HTML und ARIA-Attribute für die Zugänglichkeit mit Screen Readern.

### Performance & Optimization
*   **Loading States:** Überall dort, wo asynchrone Prozesse (z.B. n8n-Workflows) im Hintergrund ablaufen, werden Ladeanimationen und Texthinweise angezeigt. Der Status bleibt auch nach Seitenwechsel oder Reload erhalten.
*   **Progressive Enhancement:** Kernfunktionen sind auch bei langsameren Verbindungen nutzbar.
*   **Image/Bundle Optimization:** Optimierung der Ladegeschwindigkeit durch komprimierte Bilder, Code-Splitting und Lazy Loading von Komponenten.

## 7. Anforderungen (Requirements/SRD)

### Funktionale Anforderungen (FR)

*   **FR-001: Benutzerverwaltung**
    *   FR-001.01: Benutzerregistrierung per E-Mail und Passwort. (Feature Library → 01-Auth-Profile-Pattern.md)
    *   FR-001.02: Benutzer-Login und Logout. (Feature Library → 01-Auth-Profile-Pattern.md)
    *   FR-001.03: Verwaltung von Benutzerprofilen (Sprache, Theme-Einstellungen).
    *   FR-001.04: Echtzeit-Sprachwechsel zwischen Deutsch und Englisch.
    *   FR-001.05: Auswahl zwischen hellem und dunklem Theme, pro User gespeichert.
*   **FR-002: Organisationsmanagement**
    *   FR-002.01: Anzeige aller Organisationen, in denen der Benutzer Mitglied ist.
    *   FR-002.02: Wechsel der aktiven Organisation über ein Dropdown-Menü.
    *   FR-002.03: Erstellung neuer Organisationen (Name, Beschreibung).
    *   FR-002.04: Bearbeitung von Organisationsname und -beschreibung durch Owner.
    *   FR-002.05: Hinzufügen von Teammitgliedern per E-Mail-Einladung (durch Owner).
    *   FR-002.06: Zuweisung von Rollen an Teammitglieder: Owner, Manager, Read-Only.
    *   FR-002.07: Löschen von Organisationen durch Owner.
*   **FR-003: Projektmanagement**
    *   FR-003.01: Auflistung aller Projekte innerhalb der aktiven Organisation (linke Seitenleiste).
    *   FR-003.02: Erstellung neuer Sales-Projekte (Titel, Beschreibung) durch Owner/Manager.
    *   FR-003.03: Bearbeitung und Archivierung/Löschen von Projekten (Kontextmenü) durch Owner/Manager.
    *   FR-003.04: Jedes Projekt erhält einen dedizierten/isolierten Datensatz in den `companies` und `project_emails` Tabellen.
*   **FR-004: Workflow "Unternehmen Finden" (Finder Felix)**
    *   FR-004.01: Chat-Fenster für Freitext-Eingaben zur Suche nach Firmen.
    *   FR-004.02: Übermittlung der Anfrage an n8n-Workflow "Finder Felix" über Webhook.
    *   FR-004.03: Anzeige einer Ladeanimation und Hinweistext während des KI-Prozesses.
    *   FR-004.04: Anzeige der gefundenen Unternehmen in einer scrollbaren Liste.
    *   FR-004.05: Bearbeitung einzelner Firmeneinträge (durch Owner/Manager).
*   **FR-005: Workflow "Unternehmen Analysieren" (Analyse Anna)**
    *   FR-005.01: Chat-Fenster für Freitext-Eingaben zur Analyse von Firmen.
    *   FR-005.02: Übermittlung der Anfrage an n8n-Workflow "Analyse Anna" über Webhook.
    *   FR-005.03: Anzeige einer Ladeanimation und Hinweistext während des KI-Prozesses.
    *   FR-005.04: Anzeige der Analyseergebnisse in einer Detailansicht pro Unternehmen.
*   **FR-006: Workflow "Unternehmen Kontaktieren" (Pitch Paul)**
    *   FR-006.01: Chat-Fenster für Freitext-Eingaben zur E-Mail-Generierung.
    *   FR-006.02: Übermittlung der Anfrage an n8n-Workflow "Pitch Paul" (Email-Erstellung) über Webhook.
    *   FR-006.03: Anzeige einer Ladeanimation und Hinweistext während des KI-Prozesses.
    *   FR-006.04: Auflistung der generierten E-Mails mit Unternehmensname, E-Mail-Adresse und den ersten Zeilen des Inhalts.
    *   FR-006.05: Bearbeitung des E-Mail-Inhalts mittels Rich-Text-Editor (durch Owner/Manager).
    *   FR-006.06: Manueller Versand einzelner E-Mails über einen speziellen Button (durch Owner/Manager).
    *   FR-006.07: Batch-Versand aller oder ausgewählter E-Mails nach Bestätigungsabfrage (durch Owner/Manager).
    *   FR-006.08: Jede E-Mail darf nur einmal versendet werden. Nach Versand: Icon-Änderung und Deaktivierung des Sende-Buttons.
*   **FR-007: Allgemeine Workflow-Interaktion**
    *   FR-007.01: Persistence des Workflow-Status über Seitenwechsel und Reloads hinweg.
    *   FR-007.02: Eindeutige Anzeige des aktuellen Workflow-Status für den Benutzer.

### Nicht-funktionale Anforderungen (NFR)

*   **NFR-001: Performance**
    *   NFR-001.01: Ladezeiten der Hauptansichten unter 2 Sekunden (ohne n8n-Workflow-Ausführung).
    *   NFR-001.02: Listenansichten müssen hunderte von Einträgen flüssig anzeigen können (Infinite Scrolling).
    *   NFR-001.03: n8n-Workflows sollen innerhalb angemessener Zeit (für KI-Prozesse) ausgeführt werden, ohne das Frontend zu blockieren.
*   **NFR-002: Sicherheit**
    *   NFR-002.01: Datenzugriff über RLS in Supabase muss strikt der Rollenzuweisung folgen. (Feature Library → 03-Security-Pattern.md)
    *   NFR-002.02: Webhook-Kommunikation zwischen Frontend und n8n muss authentifiziert/signiert sein.
    *   NFR-002.03: Schutz vor OWASP Top 10 Schwachstellen.
    *   NFR-002.04: Sichere Speicherung von Zugangsdaten und Keys.
*   **NFR-003: Verfügbarkeit**
    *   NFR-003.01: 99.9% Verfügbarkeit der Anwendung.
    *   NFR-003.02: n8n-Instanzen müssen hochverfügbar sein (z.B. durch Mehrfachinstanzen oder Managed Service).
*   **NFR-004: Usability**
    *   NFR-004.01: Intuitive Benutzeroberfläche gemäß "Sales-Website"-Look & Feel.
    *   NFR-004.02: Klare visuelle Hierarchie und Feedbackmechanismen für Benutzeraktionen.
    *   NFR-004.03: Responsives Design für Desktop und Mobile Geräte.
*   **NFR-005: Skalierbarkeit**
    *   NFR-005.01: Unterstützung für eine wachsende Anzahl von Benutzern, Organisationen und Projekten.
    *   NFR-005.02: Datenbankschema muss bis zu Millionen von Einträgen in `companies` und `project_emails` effizient verwalten können.
*   **NFR-006: Wartbarkeit**
    *   NFR-006.01: Klar definierte Code-Module und Schnittstellen.
    *   NFR-006.02: Gute Testabdeckung für kritische Funktionalitäten.
    *   NFR-006.03: Einfache Erweiterbarkeit der n8n-Workflows.

### Technische Constraints
*   **Browser Support:** Aktuelle Versionen der gängigen Browser (Chrome, Firefox, Edge, Safari).
*   **Dependencies:** Supabase, n8n (Version kann aktualisiert werden).
*   **Lovable Stack:** React, Vite, Tailwind CSS.

### Integrations-Anforderungen
*   **Datenbank:** Supabase (PostgreSQL).
*   **Automatisierung:** n8n (Webhooks).
*   **KI-Dienste:** Über n8n-Workflows angebunden (z.B. OpenAI).
*   **Webscraping:** Über n8n-Workflows angebunden (z.B. Firecrawl).
*   **E-Mail-Versand:** Über n8n-Workflows angebunden (z.B. SMTP Integration).

## 8. Annahmen & Abhängigkeiten

### Technische Annahmen
*   **Lovable Expertise:** Das Entwicklerteam verfügt über fundierte Kenntnisse im Lovable-Stack (React, Vite, Tailwind) und in der Integration von Supabase.
*   **n8n-Kenntnisse:** Das Entwicklerteam besitzt die Fähigkeit, n8n-Workflows zu analysieren, anzupassen und neue Workflows zu entwickeln.
*   **API-Stabilität:** Die APIs der integrierten KI-Dienste und Webscraping-Dienste (über n8n) sind stabil und zuverlässig.
*   **Infrastruktur-Verfügbarkeit:** Supabase und die n8n-Instanzen werden als hochverfügbar angenommen.
*   **OpenAI/KI-Kosten:** Die Kosten für die Nutzung der KI-Dienste sind im Projektbudget berücksichtigt.
*   **n8n-Version:** Es wird angenommen, dass ein Update der n8n-Version keine gravierenden Backward-Compatibility-Probleme verursacht, die die bestehenden Workflows unbrauchbar machen.

### Business Annahmen
*   **User Behavior:** Die Benutzer sind bereit, mit Freitext-Eingaben für die KI-Workflows zu interagieren.
*   **Marktbedingungen:** Die kalte Akquise bleibt eine relevante und effektive Sales-Methode.
*   **Wachstum:** Das Projekt ist für ein signifikantes Wachstum in Bezug auf Benutzerzahlen und Datenvolumen ausgelegt.

### Abhängigkeiten
*   **Externe Dienste:** Verfügbarkeit und Performance von Supabase, n8n, OpenAI/KI-Diensten, Firecrawl.
*   **Team:** Verfügbarkeit von Entwicklern mit den erforderlichen Skillsets (React, Supabase, n8n, UI/UX).
*   **Daten:** Die `german_districts` und `german_citys` Datenbanken sind korrekt befüllt und die darin enthaltenen Daten sind konsistent.
*   **Infrastruktur:** Hosting-Umgebung für n8n (z.B. Docker, Cloud-Provider).

## 9. Glossar & Begriffe

*   **API:** Application Programming Interface
*   **BaaS:** Backend-as-a-Service (hier: Supabase)
*   **CORS:** Cross-Origin Resource Sharing
*   **CRUD:** Create, Read, Update, Delete
*   **Frontend:** Benutzeroberfläche der Anwendung
*   **i18n:** Internationalisierung
*   **JWT:** JSON Web Token
*   **KI:** Künstliche Intelligenz
*   **Lovable:** Bezeichnet den Frontend-Stack (React, Vite, Tailwind)
*   **n8n:** Open-Source-Workflow-Automatisierungstool
*   **NFR:** Nicht-funktionale Anforderung
*   **Owner:** Rolle mit administrativen Rechten in Organisation/Projekt
*   **PostgreSQL:** Relationales Datenbanksystem
*   **RLS:** Row Level Security
*   **Sales-Workflow:** Der übergeordnete Prozess der Kaltaquise
*   **SPA:** Single-Page Application
*   **Supabase:** Open-Source-Alternative zu Firebase für BaaS
*   **Tailwind CSS:** Utility-First CSS Framework
*   **UI/UX:** User Interface / User Experience
*   **Vite:** Build-Tool für moderne Webentwicklung
*   **Webhook:** Ein Mechanismus, über den eine App andere Apps über Ereignisse informiert.

## 10. Implementierung & Deployment

### Development Workflow
*   **Git:** Versionskontrolle über Git mit einem Branching-Modell (z.B. Git Flow oder GitHub Flow).
*   **Code Review:** Alle Code-Änderungen werden vor dem Mergen durch Peer Reviews geprüft.
*   **Testing:**
    *   **Unit Tests:** Für kleinere, isolierte Code-Einheiten (Frontend-Komponenten, Utility-Funktionen).
    *   **Integration Tests:** Für die Interaktion zwischen Frontend und Supabase, sowie grundlegende n8n-Webhook-Triggerings.
    *   **End-to-End Tests:** Für die wichtigsten User Journeys, um die Funktionalität des gesamten Systems zu gewährleisten.
*   **QA:** Regelmäßige Quality Assurance Zyklen zur Überprüfung der Funktionalität, Usability und Einhaltung der Anforderungen.

### Deployment Pipeline
*   **Build:** Automatisierter Build-Prozess für das Frontend (Vite) generiert optimierte statische Assets.
*   **Environments:** Trennung von Development, Staging und Production Umgebungen für Supabase und n8n.
*   **CI/CD:** Continuous Integration und Continuous Deployment für das Frontend. Automatisches Deployment bei Änderungen im Hauptbranch (z.B. Vercel, Netlify).
*   **n8n Deployment:** n8n-Workflows werden manuell oder über ein separates CI/CD für n8n auf die jeweiligen Umgebungen verteilt.
*   **Rollback:** Möglichkeit zum schnellen Rollback auf vorherige stabile Versionen im Fehlerfall.

### Monitoring & Maintenance
*   **App Monitoring (Frontend):** Tools wie Sentry oder Datadog für Error Tracking und Performance Monitoring der Frontend-Anwendung.
*   **Error Tracking (n8n):** Das n8n-Dashboard und interne Logging für die Überwachung von Workflow-Fehlern und -Ausführungen.
*   **Performance Monitoring (Supabase):** Supabase-eigene Tools zur Überwachung der Datenbank-Performance und Auth-Metriken.
*   **Maintenance:** Regelmäßige Updates der Bibliotheken und Abhängigkeiten. Wartung der n8n-Workflows und -Instanzen. Datenbankwartung.

### Documentation Maintenance
*   **Update Procedures:** Klare Richtlinien für die Aktualisierung dieser Dokumentation bei Änderungen an Architektur, Design oder Anforderungen.
*   **Version Control:** Diese Dokumentation wird im selben Git-Repository wie der Code verwaltet, um Versionskontrolle und Nachvollziehbarkeit zu gewährleisten.
*   **Reviews:** Regelmäßige Überprüfung und Genehmigung der Dokumentation durch Stakeholder und Entwickler.
