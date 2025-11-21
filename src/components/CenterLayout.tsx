import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, UserPlus, CheckSquare, FileText, BarChart3, BookOpen, ClipboardCheck, User, Brain, LogOut, Shield, Calendar, DollarSign, LayoutList, Book, Paintbrush, AlertTriangle, Users, UserCheck, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar"; // Import the new Sidebar component

const navItems = [
  { to: "/", label: "Dashboard", icon: Home, role: 'center' },
  { to: "/register", label: "Register Student", icon: UserPlus, role: 'center' },
  { to: "/attendance", label: "Take Attendance", icon: CheckSquare, role: 'center' },
  { to: "/attendance-summary", label: "Attendance Summary", icon: Calendar, role: 'center' },
  { to: "/lesson-plans", label: "Lesson Plans", icon: LayoutList, role: 'center' },
  { to: "/lesson-tracking", label: "Lesson Tracking", icon: BookOpen, role: 'center' },
  { to: "/homework", label: "Homework", icon: Book, role: 'center' },
  { to: "/activities", label: "Activities", icon: Paintbrush, role: 'center' },
  { to: "/discipline", label: "Discipline", icon: AlertTriangle, role: 'center' },
  { to: "/teachers", label: "Teachers", icon: Users, role: 'center' },
  { to: "/teacher-attendance", label: "Teacher Attendance", icon: UserCheck, role: 'center' },
  { to: "/tests", label: "Tests", icon: ClipboardCheck, role: 'center' },
  { to: "/student-report", label: "Student Report", icon: User, role: 'center' },
  { to: "/ai-insights", label: "AI Insights", icon: Brain, role: 'center' },
  { to: "/records", label: "View Records", icon: FileText, role: 'center' },
  { to: "/summary", label: "Summary", icon: BarChart3, role: 'center' },
  { to: "/finance", label: "Finance", icon: DollarSign, role: 'center' },
  { to: "/change-password", label: "Change Password", icon: KeyRound, role: 'center' }, // Added Change Password
];

export default function CenterLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const headerContent = (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
        <CheckSquare className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {user?.center_name || 'AttendTrack'}
        </h1>
        <p className="text-xs text-muted-foreground">
          {user?.role === 'admin' ? 'Admin Panel' : 'Tuition Center'}
        </p>
      </div>
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{user?.username}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        navItems={navItems}
        currentRole={user?.role || 'center'}
        headerContent={headerContent}
        footerContent={footerContent}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}