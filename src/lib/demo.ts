/**
 * Konstanten für die öffentliche Demo-Version auf der Landingpage.
 * Diese IDs sind in der lokalen Supabase-DB als Demo-Einträge mit
 * Public-RLS-Policies konfiguriert (siehe docs/DEMO_SETUP.sql).
 */
export const DEMO_USER_ID = '34fc522c-4c10-463b-b8d4-8625d1476eda';
export const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000d30';
export const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000d31';

/** Hartes Limit für Demo-Läufe — wird im Frontend UND in der Edge Function durchgesetzt. */
export const DEMO_MAX_COMPANIES = 10;

/** Vordefinierte Dummy-Daten für die Demo-Workflows. */
export const DEMO_DUMMY_DATA = {
  felix: {
    state: 'Hamburg',
    city: 'Hamburg',
    category: 'Restaurants',
    maxCompanies: DEMO_MAX_COMPANIES,
  },
  anna: {
    analyseInstructionName: 'Standard-Analyse',
    analyseInstruction:
      'Analysiere die Webseite des Unternehmens. Identifiziere Branche, Zielgruppe, Alleinstellungsmerkmale, mögliche Pain Points und Verbesserungspotenziale für die digitale Präsenz.',
    userGoal: 'Webseiten-Optimierung und SEO-Beratung anbieten',
  },
  paul: {
    userGoal:
      'Wir bieten professionelle Webseiten-Optimierung und SEO-Beratung. ' +
      'Unser Ziel ist es, dem Kunden zu zeigen, wie er mit einer modernen Website mehr Gäste gewinnen kann.',
    sellerName: 'Max Mustermann',
    sellerCompany: 'Demo Webagentur GmbH',
    sellerPhone: '+49 40 123456',
    sellerAddress: 'Demostraße 1, 20095 Hamburg',
    sellerWebsite: 'https://demo-webagentur.example.com',
    sellerContact: 'max@demo-webagentur.example.com',
    templateEnumName: 'standard',
  },
} as const;
