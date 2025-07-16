import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Calendar,
  Award,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star,
  MessageSquare,
  FileText,
  Users
} from "lucide-react";

export function StudentDashboard() {
  const courses = [
    { name: "Mathematics", teacher: "Ms. Johnson", grade: "A-", progress: 85, nextClass: "Today 10:00 AM" },
    { name: "English Literature", teacher: "Mr. Smith", grade: "B+", progress: 78, nextClass: "Today 11:30 AM" },
    { name: "Chemistry", teacher: "Dr. Wilson", grade: "A", progress: 92, nextClass: "Tomorrow 9:00 AM" },
    { name: "History", teacher: "Ms. Davis", grade: "B", progress: 73, nextClass: "Tomorrow 2:00 PM" }
  ];

  const assignments = [
    { title: "Math Homework - Chapter 8", subject: "Mathematics", due: "Today", status: "pending", priority: "high" },
    { title: "Essay: Romeo and Juliet", subject: "English", due: "Friday", status: "in_progress", priority: "medium" },
    { title: "Lab Report - Chemical Reactions", subject: "Chemistry", due: "Next Week", status: "not_started", priority: "low" },
    { title: "History Project - World War II", subject: "History", due: "Next Week", status: "in_progress", priority: "medium" }
  ];

  const achievements = [
    { title: "Perfect Attendance", description: "No absences this month", icon: Award, color: "text-success" },
    { title: "Math Star", description: "Top performer in Algebra", icon: Star, color: "text-warning" },
    { title: "Team Player", description: "Great collaboration in group projects", icon: Users, color: "text-primary" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-destructive text-destructive-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      case 'not_started': return 'bg-muted text-muted-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, Alex!</h1>
          <p className="text-muted-foreground">Ready to learn something new today?</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">View Schedule</Button>
          <Button variant="secondary">Messages</Button>
          <Button variant="gradient">Study Mode</Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="shadow-card bg-gradient-success text-success-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Progress
          </CardTitle>
          <CardDescription className="text-success-foreground/80">
            Keep up the great work!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">3.7</div>
              <div className="text-sm opacity-80">Overall GPA</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">96%</div>
              <div className="text-sm opacity-80">Attendance Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm opacity-80">Achievements Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Courses
            </CardTitle>
            <CardDescription>
              Your current course progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.map((course) => (
              <div key={course.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{course.name}</div>
                  <div className="text-sm text-muted-foreground">{course.teacher}</div>
                  <div className="text-xs text-muted-foreground">Next: {course.nextClass}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className={`text-lg font-bold ${getGradeColor(course.grade)}`}>
                    {course.grade}
                  </div>
                  <div className="text-sm text-muted-foreground">{course.progress}%</div>
                  <Progress value={course.progress} className="w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assignments
            </CardTitle>
            <CardDescription>
              Upcoming and current assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments.map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{assignment.title}</div>
                  <div className="text-sm text-muted-foreground">{assignment.subject}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm">Due: {assignment.due}</div>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
            <CardDescription>
              Your latest accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <achievement.icon className={`h-8 w-8 ${achievement.color}`} />
                <div>
                  <div className="font-medium">{achievement.title}</div>
                  <div className="text-sm text-muted-foreground">{achievement.description}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              Your classes for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div>
                  <div className="font-medium">Mathematics</div>
                  <div className="text-sm text-muted-foreground">Room 205 • Ms. Johnson</div>
                </div>
                <div className="text-sm font-medium">10:00 AM</div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">English Literature</div>
                  <div className="text-sm text-muted-foreground">Room 114 • Mr. Smith</div>
                </div>
                <div className="text-sm font-medium">11:30 AM</div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                <div>
                  <div className="font-medium">Lunch Break</div>
                  <div className="text-sm text-muted-foreground">Cafeteria</div>
                </div>
                <div className="text-sm font-medium">12:30 PM</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}