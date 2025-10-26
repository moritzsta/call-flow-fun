import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, Globe, MapPin, User } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';

interface CompanyInfoProps {
  company: Company;
}

export const CompanyInfo = ({ company }: CompanyInfoProps) => {
  const getStatusBadge = (status: Company['status']) => {
    const config = {
      found: { label: 'Gefunden', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      analyzed: { label: 'Analysiert', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
      contacted: { label: 'Kontaktiert', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      rejected: { label: 'Abgelehnt', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
    };

    return (
      <Badge variant="secondary" className={config[status].className}>
        {config[status].label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Firmeninformationen
          </CardTitle>
          {getStatusBadge(company.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Firmenname</p>
            <p className="font-medium">{company.company}</p>
          </div>
          {company.industry && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Branche</p>
              <p className="font-medium">{company.industry}</p>
            </div>
          )}
        </div>

        {/* Contact Person */}
        {company.ceo_name && (
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              Geschäftsführer/in
            </p>
            <p className="font-medium">{company.ceo_name}</p>
          </div>
        )}

        {/* Contact Details */}
        <div className="space-y-3">
          {company.email && (
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">E-Mail</p>
                <a
                  href={`mailto:${company.email}`}
                  className="text-primary hover:underline"
                >
                  {company.email}
                </a>
              </div>
            </div>
          )}
          {company.phone && (
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <a
                  href={`tel:${company.phone}`}
                  className="text-primary hover:underline"
                >
                  {company.phone}
                </a>
              </div>
            </div>
          )}
          {company.website && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {company.website}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        {(company.address || company.city || company.state) && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <div className="space-y-1">
                {company.address && <p>{company.address}</p>}
                <p>
                  {company.city && company.city}
                  {company.city && company.state && ', '}
                  {company.state && company.state}
                </p>
                {company.district && (
                  <p className="text-sm text-muted-foreground">Bezirk: {company.district}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Erstellt am</p>
            <p className="font-medium">
              {new Date(company.created_at).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Aktualisiert am</p>
            <p className="font-medium">
              {new Date(company.updated_at).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
