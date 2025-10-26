import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProjectEmail, EmailSortConfig } from '@/hooks/useEmails';
import { MoreHorizontal, ArrowUpDown, Trash2, Eye, Send, Mail, Building } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveTable, MobileCard } from '@/components/ui/responsive-table';

interface EmailsTableProps {
  emails: ProjectEmail[];
  projectId: string;
  onDelete: (emailId: string) => void;
  onSend: (emailId: string, userId: string) => void;
  sortConfig: EmailSortConfig;
  onSortChange: (config: EmailSortConfig) => void;
}

const statusMap = {
  draft: { label: 'Entwurf', className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
  ready_to_send: { label: 'Bereit', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  sent: { label: 'Versendet', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  failed: { label: 'Fehlgeschlagen', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
};

export const EmailsTable = ({
  emails,
  projectId,
  onDelete,
  onSend,
  sortConfig,
  onSortChange,
}: EmailsTableProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ProjectEmail | null>(null);

  const handleSort = (field: EmailSortConfig['field']) => {
    onSortChange({
      field,
      ascending: sortConfig.field === field ? !sortConfig.ascending : true,
    });
  };

  const handleDeleteClick = (email: ProjectEmail) => {
    setSelectedEmail(email);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedEmail) {
      onDelete(selectedEmail.id);
    }
    setDeleteDialogOpen(false);
    setSelectedEmail(null);
  };

  const getStatusBadge = (status: ProjectEmail['status']) => {
    return (
      <Badge variant="secondary" className={statusMap[status].className}>
        {statusMap[status].label}
      </Badge>
    );
  };

  const isMobile = useIsMobile();

  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine E-Mails gefunden</p>
        <p className="text-sm text-muted-foreground mt-2">
          Starten Sie Pitch Paul, um E-Mails zu generieren
        </p>
      </div>
    );
  }

  const mobileView = (
    <div className="space-y-3">
      {emails.map((email) => (
        <MobileCard key={email.id} onClick={() => navigate(`/emails/${email.id}`)}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-base line-clamp-2">{email.subject}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mail className="h-3 w-3" />
                  {email.recipient_email}
                </div>
                {email.company_name && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Building className="h-3 w-3" />
                    {email.company_name}
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" aria-label="Aktionen für E-Mail anzeigen">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/emails/${email.id}`);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Details anzeigen
                  </DropdownMenuItem>
                  {(email.status === 'draft' || email.status === 'ready_to_send') && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Send email', email.id);
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Versenden
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(email);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between">
              {getStatusBadge(email.status)}
              <div className="text-xs text-muted-foreground">
                {format(new Date(email.created_at), 'dd.MM.yy HH:mm', { locale: de })}
              </div>
            </div>

            {email.sent_at && (
              <div className="text-xs text-muted-foreground">
                Versendet: {format(new Date(email.sent_at), 'dd.MM.yy HH:mm', { locale: de })}
              </div>
            )}
          </div>
        </MobileCard>
      ))}
    </div>
  );

  return (
    <>
      <ResponsiveTable mobileView={mobileView}>
        <div className="rounded-md border">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('subject')}
                  className="-ml-3"
                  aria-label="Nach Betreff sortieren"
                >
                  Betreff
                  <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead>Empfänger</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="-ml-3"
                  aria-label="Nach Status sortieren"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('created_at')}
                  className="-ml-3"
                  aria-label="Nach Erstelldatum sortieren"
                >
                  Erstellt
                  <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('sent_at')}
                  className="-ml-3"
                  aria-label="Nach Versanddatum sortieren"
                >
                  Versendet
                  <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Aktionen</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {email.subject}
                </TableCell>
                <TableCell>{email.recipient_email}</TableCell>
                <TableCell>{email.company_name || '-'}</TableCell>
                <TableCell>{getStatusBadge(email.status)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(email.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {email.sent_at
                    ? format(new Date(email.sent_at), 'dd.MM.yyyy HH:mm', { locale: de })
                    : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Aktionen für E-Mail anzeigen">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/emails/${email.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Details anzeigen
                      </DropdownMenuItem>
                      {(email.status === 'draft' || email.status === 'ready_to_send') && (
                        <DropdownMenuItem
                          onClick={() => {
                            // TODO: Get user ID from context
                            console.log('Send email', email.id);
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Versenden
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(email)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </ResponsiveTable>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>E-Mail löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die E-Mail "{selectedEmail?.subject}" wirklich löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
