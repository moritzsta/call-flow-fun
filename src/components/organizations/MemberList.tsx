import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useOrganizationMembers, type OrganizationMember } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';

interface MemberListProps {
  organizationId: string;
  isOwner: boolean;
}

const roleLabels = {
  owner: 'Owner',
  manager: 'Manager',
  read_only: 'Read-Only',
};

const roleBadgeVariants = {
  owner: 'default' as const,
  manager: 'secondary' as const,
  read_only: 'outline' as const,
};

export const MemberList = ({ organizationId, isOwner }: MemberListProps) => {
  const { user } = useAuth();
  const { members, isLoading, updateMemberRole, removeMember } = useOrganizationMembers(organizationId);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const handleRoleChange = (memberId: string, role: 'owner' | 'manager' | 'read_only') => {
    setUpdatingMemberId(memberId);
    updateMemberRole({ memberId, role }, {
      onSettled: () => setUpdatingMemberId(null),
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Lade Mitglieder...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Noch keine Mitglieder in dieser Organisation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const isCurrentUser = user?.id === member.user_id;
        const canEdit = isOwner && !isCurrentUser;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(member.profiles?.full_name || null)}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {member.profiles?.full_name || 'Unbekannt'}
                  </p>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">Sie</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {member.profiles?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit ? (
                <Select
                  value={member.role}
                  onValueChange={(value) =>
                    handleRoleChange(member.id, value as 'owner' | 'manager' | 'read_only')
                  }
                  disabled={updatingMemberId === member.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read_only">Read-Only</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={roleBadgeVariants[member.role]}>
                  {roleLabels[member.role]}
                </Badge>
              )}

              {canEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {member.profiles?.full_name || member.profiles?.email} wird aus dieser
                        Organisation entfernt und verliert den Zugriff auf alle Projekte.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeMember(member.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Entfernen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
