import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * CenterDashboard
 * Dashboard for tuition center users to view their center's statistics.
 * Features:
 *  - Total Students
 *  - Present Today
 *  - Absent Today
 *  - Attendance Rate
 * 
 * All data is filtered by the logged-in user's center_id.
 */

export default function CenterDashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // ---------------------------
  // 0️⃣ Access control
  // ---------------------------
  if (!user && loading) return <p>Loading user info...</p>;
  if (user?.role === "admin") return <p>Admins should use the Admin Dashboard.</p>;
  const centerId = user?.center_id;

  // ---------------------------
  // 1️⃣ Date helpers
  // ---------------------------
  const today = new Date();
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const todayString = formatDate(today); // "YYYY-MM-DD"

  // ---------------------------
  // 2️⃣ Debug state (optional)
  // ---------------------------
  const [debugAttendance, setDebugAttendance] = useState<any[]>([]);

  // ---------------------------
  // 3️⃣ Fetch total students
  // ---------------------------
  const {
    data: studentsCount,
    isLoading: loadingStudents,
    error: errorStudents,
  } = useQuery({
    queryKey: ["students-count", centerId],
    queryFn: async () => {
      if (!centerId) return 0;
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("center_id", centerId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!centerId && !loading,
  });

  // ---------------------------
  // 4️⃣ Fetch today's attendance
  // ---------------------------
  const {
    data: todayAttendance,
    isLoading: loadingAttendance,
    error: errorAttendance,
  } = useQuery({
    queryKey: ["today-attendance", todayString, centerId],
    queryFn: async () => {
      if (!centerId) return [];

      // Supabase column 'date' is assumed to be type 'date'
      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("center_id", centerId)
        .eq("date", todayString);

      if (error) throw error;

      setDebugAttendance(data || []);
      return data || [];
    },
    enabled: !!centerId && !loading,
  });

  // ---------------------------
  // 5️⃣ Calculate present / absent / attendance rate
  // ---------------------------
  const presentCount = todayAttendance?.filter(a => a.status === "Present").length || 0;
  const absentCount = todayAttendance?.filter(a => a.status === "Absent").length || 0;
  const attendanceRate = studentsCount ? Math.round((presentCount / studentsCount) * 100) : 0;

  // ---------------------------
  // 6️⃣ Stats cards array
  // ---------------------------
  const stats = [
    {
      title: "Total Students",
      value: studentsCount || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Present Today",
      value: presentCount,
      icon: CheckCircle2,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Absent Today",
      value: absentCount,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Attendance Rate",
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  // ---------------------------
  // 7️⃣ Error handling
  // ---------------------------
  useEffect(() => {
    if (errorStudents) {
      toast({
        title: "Error fetching students",
        description: errorStudents.message,
        variant: "destructive",
      });
    }
    if (errorAttendance) {
      toast({
        title: "Error fetching attendance",
        description: errorAttendance.message,
        variant: "destructive",
      });
    }
  }, [errorStudents, errorAttendance, toast]);

  // ---------------------------
  // 8️⃣ Optional debug log
  // ---------------------------
  useEffect(() => {
    console.log("Today's attendance data:", debugAttendance);
  }, [debugAttendance]);

  // ---------------------------
  // 9️⃣ Loading states
  // ---------------------------
  if (loading || loadingStudents || loadingAttendance) {
    return <p>Loading dashboard...</p>;
  }

  // ---------------------------
  // 🔟 Render UI
  // ---------------------------
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Center Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's today's attendance overview for your center.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Optional footer / notes */}
      <div className="text-sm text-muted-foreground">
        * Data is updated live from your center's records.
      </div>
    </div>
  );
}
