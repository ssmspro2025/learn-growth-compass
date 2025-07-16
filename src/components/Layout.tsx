import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserRole = 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'vendor' | 'developer';

export interface LayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const roleColors = {
  admin: 'bg-destructive text-destructive-foreground',
  principal: 'bg-primary text-primary-foreground',
  teacher: 'bg-secondary text-secondary-foreground',
  student: 'bg-accent text-accent-foreground',
  parent: 'bg-success text-success-foreground',
  vendor: 'bg-warning text-warning-foreground',
  developer: 'bg-muted text-muted-foreground'
};

export function Layout({ children, currentRole, onRoleChange }: LayoutProps) {
  const [notifications] = useState(3);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">EduManage Pro</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Switcher for Demo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Badge className={roleColors[currentRole]}>
                    {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                  </Badge>
                  Switch Role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Demo Mode - Switch Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(roleColors) as UserRole[]).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => onRoleChange(role)}
                    className={currentRole === role ? "bg-muted" : ""}
                  >
                    <Badge className={`${roleColors[role]} mr-2`} variant="secondary">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-destructive text-destructive-foreground">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden md:inline">John Doe</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex w-full pt-16">
          <AppSidebar currentRole={currentRole} />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}