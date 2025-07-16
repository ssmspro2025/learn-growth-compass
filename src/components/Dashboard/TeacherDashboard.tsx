import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
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
  FileText,
  UserCheck,
  Plus,
  Edit
} from "lucide-react";

export function TeacherDashboard() {
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const classes = [
    { name: "Math 7A", students: 28, period: "1st", attendance: 96, avgGrade: 87, assignments: 3 },
    { name: "Math 7B", students: 25, period: "3rd", attendance: 94, avgGrade: 82, assignments: 2 },
    { name: "Algebra I", students: 30, period: "5th", attendance: 98, avgGrade: 91, assignments: 1 },
    { name: "Geometry", students: 22, period: "7th", attendance: 92, avgGrade: 89, assignments: 4 }
  ];

  const gradeData = [
    { week: "Week 1", mathA: 85, mathB: 80, algebra: 88, geometry: 87 },
    { week: "Week 2", mathA: 87, mathB: 82, algebra: 90, geometry: 89 },
    { week: "Week 3", mathA: 87, mathB: 82, algebra: 91, geometry: 89 },
  ];

  const attendanceData = [
    { week: "Week 1", mathA: 95, mathB: 92, algebra: 97, geometry: 90 },
    { week: "Week 2", mathA: 96, mathB: 94, algebra: 98, geometry: 92 },
    { week: "Week 3", mathA: 96, mathB: 94, algebra: 98, geometry: 92 },
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
          <Dialog open={attendanceMode} onOpenChange={setAttendanceMode}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserCheck className="h-4 w-4 mr-2" />
                Take Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Take Attendance - Today's Classes</DialogTitle>
                <DialogDescription>
                  Mark attendance for all your classes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls.name} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">{cls.name} - {cls.period} Period</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <Button size="sm" variant="outline" className="bg-success/10 text-success">
                        Present: {Math.floor(cls.students * (cls.attendance / 100))}
                      </Button>
                      <Button size="sm" variant="outline" className="bg-destructive/10 text-destructive">
                        Absent: {cls.students - Math.floor(cls.students * (cls.attendance / 100))}
                      </Button>
                      <Button size="sm" variant="outline">Mark All Present</Button>
                      <Button size="sm" variant="secondary">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" onClick={() => alert('Opening gradebook...')}>
            Grade Book
          </Button>
          <Button variant="gradient" onClick={() => alert('Opening lesson planner...')}>
            <Plus className="h-4 w-4 mr-2" />
            Lesson Plan
          </Button>
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
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setSelectedClass(cls.name)}
                  >
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
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => setAttendanceMode(true)}
            >
              <Users className="h-8 w-8" />
              <span className="text-sm">Take Attendance</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening assignment grading interface...')}
            >
              <FileText className="h-8 w-8" />
              <span className="text-sm">Grade Assignments</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening lesson plan editor...')}
            >
              <BookOpen className="h-8 w-8" />
              <span className="text-sm">Lesson Plans</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening messaging center...')}
            >
              <MessageSquare className="h-8 w-8" />
              <span className="text-sm">Messages</span>
            </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Grade Trends
            </CardTitle>
            <CardDescription>
              Weekly average grades across your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="algebra" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="geometry" stroke="#8b5cf6" strokeWidth={3} />
                <Line type="monotone" dataKey="mathA" stroke="#06b6d4" strokeWidth={3} />
                <Line type="monotone" dataKey="mathB" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Attendance Patterns
            </CardTitle>
            <CardDescription>
              Weekly attendance rates by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="algebra" fill="#10b981" />
                <Bar dataKey="geometry" fill="#8b5cf6" />
                <Bar dataKey="mathA" fill="#06b6d4" />
                <Bar dataKey="mathB" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}