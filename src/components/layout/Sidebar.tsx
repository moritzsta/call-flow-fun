import { NavLink, useLocation } from 'react-router-dom';
import { Building2, FolderOpen, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    name: 'Organisationen',
    href: '/organizations',
    icon: Building2,
    color: 'text-highlight',
    bgColor: 'bg-highlight/10',
  },
  {
    name: 'Projekte',
    href: '/projects',
    icon: FolderOpen,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    name: 'Einstellungen',
    href: '/settings',
    icon: Settings,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Logo/Brand with gradient */}
      <div className="flex items-center h-16 px-6 border-b border-border bg-gradient-to-r from-card via-card to-primary/5">
        {state === 'expanded' ? (
          <h1 className="text-xl font-bold text-gradient">
            Cold Calling App
          </h1>
        ) : (
          <span className="text-xl font-bold text-gradient">CC</span>
        )}
      </div>

      <SidebarContent className="bg-gradient-to-b from-card to-card/50">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink 
                        to={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          "group relative transition-all duration-200 rounded-lg",
                          "hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/5",
                          active && "bg-gradient-to-r from-primary/15 to-accent/10 border-l-2 border-l-primary"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center rounded-md p-1 transition-colors",
                          active ? item.bgColor : "group-hover:" + item.bgColor
                        )}>
                          <Icon 
                            className={cn(
                              "h-5 w-5 transition-all duration-200",
                              active ? item.color : "text-muted-foreground group-hover:" + item.color
                            )} 
                            aria-hidden="true" 
                          />
                        </div>
                        <span className={cn(
                          "transition-colors duration-200",
                          active ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {item.name}
                        </span>
                        {/* Active indicator dot */}
                        {active && (
                          <span className="absolute right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with gradient */}
      {state === 'expanded' && (
        <div className="p-4 border-t border-border bg-gradient-to-r from-card to-primary/5">
          <p className="text-xs text-muted-foreground text-center">
            Version 1.0 ✨
          </p>
        </div>
      )}
    </Sidebar>
  );
};
