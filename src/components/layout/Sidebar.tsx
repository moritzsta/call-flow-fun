import { NavLink, useLocation } from 'react-router-dom';
import { Building2, FolderOpen, BarChart3, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

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

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigation.some((item) => isActive(item.href));

  return (
    <Sidebar collapsible="icon">
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        {state === 'expanded' ? (
          <h1 className="text-xl font-bold text-foreground">
            Cold Calling App
          </h1>
        ) : (
          <span className="text-xl font-bold text-foreground">CC</span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <NavLink 
                        to={item.href}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      {state === 'expanded' && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Version 1.0
          </p>
        </div>
      )}
    </Sidebar>
  );
};
