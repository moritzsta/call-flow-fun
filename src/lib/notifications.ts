import { toast } from 'sonner';

/**
 * Zentrale Notification-Helper für konsistente Toast-Messages
 * Verwendet sonner für Toast-Benachrichtigungen
 */

// ===================
// Generic Notifications
// ===================

export const notifySuccess = (message: string, description?: string) => {
  toast.success(message, description ? { description } : undefined);
};

export const notifyError = (message: string, description?: string) => {
  toast.error(message, description ? { description } : undefined);
};

export const notifyInfo = (message: string, description?: string) => {
  toast.info(message, description ? { description } : undefined);
};

// ===================
// Auth Notifications
// ===================

export const notifyAuthSuccess = (action: 'login' | 'logout' | 'register') => {
  const messages = {
    login: 'Erfolgreich angemeldet!',
    logout: 'Erfolgreich abgemeldet!',
    register: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails.',
  };
  toast.success(messages[action]);
};

export const notifyAuthError = (error: string) => {
  toast.error(error);
};

// ===================
// CRUD Notifications
// ===================

export const notifyItemCreated = (itemType: string) => {
  toast.success(`${itemType} erfolgreich erstellt!`);
};

export const notifyItemUpdated = (itemType: string) => {
  toast.success(`${itemType} aktualisiert!`);
};

export const notifyItemDeleted = (itemType: string) => {
  toast.success(`${itemType} gelöscht!`);
};

export const notifyItemSaved = (itemType: string) => {
  toast.success(`${itemType} gespeichert`);
};

export const notifyCrudError = (action: string, error: string) => {
  toast.error(`Fehler beim ${action}`, { description: error });
};

// ===================
// Organization Notifications
// ===================

export const notifyOrganizationCreated = () => {
  notifyItemCreated('Organisation');
};

export const notifyOrganizationUpdated = () => {
  notifyItemUpdated('Organisation');
};

export const notifyOrganizationDeleted = () => {
  notifyItemDeleted('Organisation');
};

export const notifyMemberAdded = () => {
  toast.success('Mitglied erfolgreich hinzugefügt!');
};

export const notifyMemberRemoved = () => {
  toast.success('Mitglied entfernt!');
};

export const notifyRoleUpdated = () => {
  toast.success('Rolle erfolgreich aktualisiert!');
};

// ===================
// Project Notifications
// ===================

export const notifyProjectCreated = () => {
  notifyItemCreated('Projekt');
};

export const notifyProjectUpdated = () => {
  notifyItemUpdated('Projekt');
};

export const notifyProjectArchived = () => {
  toast.success('Projekt archiviert!');
};

export const notifyProjectDeleted = () => {
  notifyItemDeleted('Projekt');
};

// ===================
// Company Notifications
// ===================

export const notifyCompanyDeleted = () => {
  toast.success('Firma wurde gelöscht');
};

export const notifyCompanyStatusUpdated = () => {
  toast.success('Status aktualisiert');
};

// ===================
// Email Notifications
// ===================

export const notifyEmailSent = (count?: number) => {
  if (count && count > 1) {
    toast.success(`${count} E-Mails erfolgreich versendet!`);
  } else {
    toast.success('E-Mail erfolgreich versendet!');
  }
};

export const notifyEmailsSentBatch = (successCount: number, totalCount: number) => {
  toast.success(`${successCount} von ${totalCount} E-Mails versendet`, {
    description: successCount < totalCount ? 'Einige E-Mails konnten nicht versendet werden' : undefined,
  });
};

export const notifyEmailSendError = (error: string) => {
  toast.error('Fehler beim Versenden der E-Mail', { description: error });
};

export const notifyEmailSaved = () => {
  notifyItemSaved('E-Mail');
};

export const notifyEmailStatusUpdated = () => {
  toast.success('Status aktualisiert');
};

export const notifyEmailDeleted = () => {
  toast.success('E-Mail wurde gelöscht');
};

export const notifyEmailError = (message: string) => {
  toast.error(message);
};

// ===================
// Workflow Notifications
// ===================

export const notifyWorkflowStarted = (workflowId: string) => {
  toast.success('Workflow erfolgreich gestartet!', {
    description: `Workflow-ID: ${workflowId}`,
  });
};

export const notifyWorkflowError = (error: string) => {
  toast.error('Fehler beim Starten des Workflows', { description: error });
};

// ===================
// Profile Notifications
// ===================

export const notifyProfileUpdated = () => {
  toast.success('Profil erfolgreich aktualisiert!');
};

export const notifyProfileError = (error: string) => {
  toast.error(`Fehler beim Aktualisieren`, { description: error });
};
