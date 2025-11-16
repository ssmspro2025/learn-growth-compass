import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, XCircle, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();

  // Today as YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0]; 

  const centerId = user?.center_id;
  const role = user?.role;

  if (loading) return <p>Loading dashboard...</p>;

  // ---------------------------
  // 1️⃣ TOTAL STUDENTS COUNT
  // ---------------------------
  const { data: studentsCount } = useQuery({
    queryKey: ["students-count", centerId],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (role !== "admin") {
        query = query.eq("center_id", centerId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // ---------------------------
  // 2️⃣ TODAY ATTENDANCE — FIXED (TIMESTAMP SAFE)
  // ---------------------------

  const { data: todayAttendance } = useQuery({
    queryKey: ["today-attendance", today, centerId],
    queryFn: async () => {

      // 🔥 FIX: timestamp-safe start/end of day
      const startOfDay = new Date(`${today}T00:00:00`);
      const endOfDay = new Date(`${today}T23:59:59`);

      let query = supabase
        .from("attendance")
        .select("status")
        .gte("date", startOfDay.toISOString())
        .lte("date", endOfDay.toISOString());

      if (role !== "admin") {
        query = query.eq("center_id", centerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });

  // ---------------------------
  // 3️⃣ CALCULATE COUNTS
  // ---------------------------

  const presentCount =
    todayAttendance?.filter((a) => a.status === "Present").length || 0;

  const absentCount =
    todayAttendance?.filter((a) => a.status === "Absent").length || 0;

  const attendanceRate =
    studentsCount ? Math.round((presentCount / studentsCount) * 100) : 0;

  // ---------------------------
  // 4️⃣ STATS CARD DATA
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
  // 5️⃣ RENDER DASHBOARD UI
  // ---------------------------

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's today's attendance overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="transition-all hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
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
    </div>
  );
}
