import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  MessageSquare,
  TrendingUp,
  Award,
  FileText
} from "lucide-react";

export function TeacherDashboard() {
  const classes = [
    { name: "Math 7A", students: 28, period: "1st", attendance: 96, avgGrade: 87, assignments: 3 },
    { name: "Math 7B", students: 25, period: "3rd", attendance: 94, avgGrade: 82, assignments: 2 },
    { name: "Algebra I", students: 30, period: "5th", attendance: 98, avgGrade: 91, assignments: 1 },
    { name: "Geometry", students: 22, period: "7th", attendance: 92, avgGrade: 89, assignments: 4 }
  ];

  const upcomingTasks = [
    { task: "Grade Chapter 5 Tests", class: "Math 7A", due: "Today", priority: "high" },
    { task: "Prepare Quiz - Quadratic Equations", class: "Algebra I", due: "Tomorrow", priority: "medium" },
    { task: "Parent Conference - Sarah Johnson", class: "Math 7B", due: "Friday", priority: "high" },
    { task: "Submit Progress Reports", class: "All Classes", due: "Next Week", priority: "medium" }
  ];

  const recentAchievements = [
    { student: "Alex Chen", achievement: "100% on Geometry Quiz", class: "Geometry" },
    { student: "Maya Patel", achievement: "Perfect Attendance Month", class: "Math 7A" },
    { student: "Jordan Smith", achievement: "Most Improved Student", class: "Algebra I" }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, Ms. Johnson!</h1>
          <p className="text-muted-foreground">Here's what's happening in your classes today</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Take Attendance</Button>
          <Button variant="secondary">Grade Book</Button>
          <Button variant="gradient">Lesson Plan</Button>
        </div>
      </div>

      {/* Today's Schedule */}
      <Card className="shadow-card bg-gradient-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Tuesday, March 14, 2024
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {classes.map((cls) => (
              <div key={cls.name} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="font-medium">{cls.name}</div>
                <div className="text-sm opacity-80">{cls.period} Period • {cls.students} students</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs">Attendance: {cls.attendance}%</span>
                  <Button size="sm" variant="secondary">
                    Enter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Class Performance
            </CardTitle>
            <CardDescription>
              Overview of your classes' progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.map((cls) => (
              <div key={cls.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {cls.students} students • {cls.assignments} pending assignments
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">Avg Grade: {cls.avgGrade}%</div>
                  <Progress value={cls.avgGrade} className="w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
            <CardDescription>
              Your to-do list and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.task}</div>
                  <div className="text-sm text-muted-foreground">{item.class}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.due}</span>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Achievements */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Student Achievements
            </CardTitle>
            <CardDescription>
              Recent highlights from your students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                <Award className="h-8 w-8 text-success" />
                <div>
                  <div className="font-medium">{achievement.student}</div>
                  <div className="text-sm text-muted-foreground">{achievement.achievement}</div>
                  <div className="text-xs text-success">{achievement.class}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common daily tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
                <Users className="h-8 w-8" />
                <span className="text-sm">Take Attendance</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
                <FileText className="h-8 w-8" />
                <span className="text-sm">Grade Assignments</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
                <BookOpen className="h-8 w-8" />
                <span className="text-sm">Lesson Plans</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
                <MessageSquare className="h-8 w-8" />
                <span className="text-sm">Messages</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}