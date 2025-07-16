import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  MessageSquare,
  Settings,
  Home,
  UserCheck,
  ClipboardList,
  TrendingUp,
  Package,
  Code,
  Monitor,
  ShoppingCart,
  FileText,
  Target,
  Award,
  Clock
} from "lucide-react";

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
} from "@/components/ui/sidebar";

import type { UserRole } from "./Layout";

interface AppSidebarProps {
  currentRole: UserRole;
}

const navigationItems = {
  admin: [
    { title: "Dashboard", icon: Home, active: true },
    { title: "School Analytics", icon: BarChart3 },
    { title: "User Management", icon: Users },
    { title: "Academic Setup", icon: GraduationCap },
    { title: "Financial Overview", icon: DollarSign },
    { title: "System Settings", icon: Settings },
    { title: "Compliance", icon: FileText },
  ],
  principal: [
    { title: "Dashboard", icon: Home, active: true },
    { title: "School Performance", icon: TrendingUp },
    { title: "Teacher Management", icon: Users },
    { title: "Student Analytics", icon: GraduationCap },
    { title: "Budget & Finances", icon: DollarSign },
    { title: "Calendar & Events", icon: Calendar },
    { title: "Reports", icon: FileText },
  ],
  teacher: [
    { title: "Dashboard", icon: Home, active: true },
    { title: "My Classes", icon: GraduationCap },
    { title: "Lesson Planner", icon: BookOpen },
    { title: "Attendance", icon: UserCheck },
    { title: "Gradebook", icon: ClipboardList },
    { title: "Student Progress", icon: TrendingUp },
    { title: "Messages", icon: MessageSquare },
    { title: "Schedule", icon: Calendar },
  ],
  student: [
    { title: "Dashboard", icon: Home, active: true },
    { title: "My Courses", icon: BookOpen },
    { title: "Assignments", icon: ClipboardList },
    { title: "Grades", icon: Award },
    { title: "Schedule", icon: Calendar },
    { title: "Progress", icon: Target },
    { title: "Messages", icon: MessageSquare },
  ],
  parent: [
    { title: "Dashboard", icon: Home, active: true },
    { title: "Children Overview", icon: Users },
    { title: "Academic Progress", icon: TrendingUp },
    { title: "Attendance", icon: Clock },
    { title: "Fee Status", icon: DollarSign },
    { title: "Messages", icon: MessageSquare },
    { title: "Events", icon: Calendar },
  ],
  vendor: [
    { title: "Dashboard", icon: Home, active: true },
    { title: "Purchase Orders", icon: ShoppingCart },
    { title: "Inventory", icon: Package },
    { title: "Invoices", icon: FileText },
    { title: "Payments", icon: DollarSign },
    { title: "Messages", icon: MessageSquare },
  ],
  developer: [
    { title: "System Monitor", icon: Monitor, active: true },
    { title: "API Analytics", icon: BarChart3 },
    { title: "Tenant Management", icon: Users },
    { title: "Performance", icon: TrendingUp },
    { title: "Error Logs", icon: Code },
    { title: "Deployments", icon: Settings },
  ],
};

export function AppSidebar({ currentRole }: AppSidebarProps) {
  const { open } = useSidebar();
  const location = useLocation();
  const items = navigationItems[currentRole];

  return (
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "px-2" : "px-4"}>
            {!open ? currentRole[0].toUpperCase() : `${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Panel`}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`${item.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} transition-colors`}
                  >
                    <a href="#" className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}