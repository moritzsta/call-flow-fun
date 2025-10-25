import { Link, useLocation } from 'react-router-dom';
import { Building2, FolderOpen, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Organisationen',
    href: '/organizations',
    icon: Building2,
  },
  {
    name: 'Projekte',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    name: 'Einstellungen',
    href: '/settings',
    icon: Settings,
  },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-card border-r border-border">
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Cold Calling App
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Version 1.0
        </p>
      </div>
    </aside>
  );
};
