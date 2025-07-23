import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  MessageSquare,
  Settings,
  ChevronDown,
  LogOut,
  User,
  School,
  UserCheck,
  UserX,
  BarChart3,
  FileText,
  Shield,
  Bell,
  Monitor
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  school_id?: string;
  tenant_id: string;
  profile_image_url?: string;
}

interface AppSidebarProps {
  currentRole: string;
  profile: UserProfile;
}

export function AppSidebar({ currentRole, profile }: AppSidebarProps) {
  const { signOut } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(["main"]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const roleConfigs = {
    super_admin: {
      name: "Super Admin",
      menus: [
        {
          id: "main",
          title: "System Management",
          items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: School, label: "Schools", href: "/schools" },
            { icon: Users, label: "All Users", href: "/users" },
            { icon: Shield, label: "Tenants", href: "/tenants" },
            { icon: BarChart3, label: "Analytics", href: "/analytics" },
            { icon: Settings, label: "System Settings", href: "/settings" },
          ]
        }
      ]
    },
    admin: {
      name: "School Admin",
      menus: [
        {
          id: "main",
          title: "Administration",
          items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: Users, label: "Users Management", href: "/users" },
            { icon: BookOpen, label: "Academic", href: "/academic" },
            { icon: DollarSign, label: "Finance", href: "/finance" },
            { icon: BarChart3, label: "Reports", href: "/reports" },
          ]
        },
        {
          id: "communication",
          title: "Communication",
          items: [
            { icon: MessageSquare, label: "Messages", href: "/messages" },
            { icon: Bell, label: "Notifications", href: "/notifications" },
          ]
        }
      ]
    },
    principal: {
      name: "Principal",
      menus: [
        {
          id: "main",
          title: "School Management",
          items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: Users, label: "Staff Management", href: "/staff" },
            { icon: BookOpen, label: "Academic Oversight", href: "/academic" },
            { icon: BarChart3, label: "School Reports", href: "/reports" },
            { icon: Calendar, label: "Events", href: "/events" },
          ]
        }
      ]
    },
    teacher: {
      name: "Teacher",
      menus: [
        {
          id: "main",
          title: "Teaching Tools",
          items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: Users, label: "My Classes", href: "/classes" },
            { icon: BookOpen, label: "Assignments", href: "/assignments" },
            { icon: Calendar, label: "Schedule", href: "/schedule" },
            { icon: UserCheck, label: "Attendance", href: "/attendance" },
            { icon: BarChart3, label: "Grades", href: "/grades" },
          ]
        }
      ]
    },
    student: {
      name: "Student",
      menus: [
        {
          id: "main",
          title: "Student Portal",
          items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: BookOpen, label: "My Courses", href: "/courses" },
            { icon: Calendar, label: "Schedule", href: "/schedule" },
            { icon: FileText, label: "Assignments", href: "/assignments" },
            { icon: BarChart3, label: "Grades", href: "/grades" },
          ]
        }
      ]
    },
    parent: {
      name: "Parent",
      menus: [
        {
          id: "main",
          title: "Parent Portal",
          items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: Users, label: "My Children", href: "/children" },
            { icon: BarChart3, label: "Progress Reports", href: "/reports" },
            { icon: Calendar, label: "Events", href: "/events" },
            { icon: DollarSign, label: "Fees", href: "/fees" },
            { icon: MessageSquare, label: "Messages", href: "/messages" },
          ]
        }
      ]
    },
    vendor: {
      name: "Vendor",
      menus: [
        {
          id: "main",
          title: "Vendor Portal",
          items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: DollarSign, label: "Orders", href: "/orders" },
            { icon: FileText, label: "Invoices", href: "/invoices" },
            { icon: MessageSquare, label: "Support", href: "/support" },
          ]
        }
      ]
    }
  };

  const currentConfig = roleConfigs[currentRole as keyof typeof roleConfigs] || roleConfigs.admin;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">SchoolOS</h2>
            <Badge variant="secondary" className="text-xs">
              {currentConfig.name}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {currentConfig.menus.map((menu) => (
            <SidebarMenuItem key={menu.id}>
              <Collapsible 
                open={openMenus.includes(menu.id)} 
                onOpenChange={() => toggleMenu(menu.id)}
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    className="w-full justify-between font-medium text-muted-foreground"
                  >
                    {menu.title}
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {menu.items.map((item) => (
                      <SidebarMenuSubItem key={item.label}>
                        <SidebarMenuSubButton asChild>
                          <a href={item.href} className="flex items-center gap-3 px-2 py-2 hover:bg-accent rounded-md transition-colors">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.profile_image_url} />
            <AvatarFallback>
              {getInitials(profile.first_name, profile.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile.email}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}