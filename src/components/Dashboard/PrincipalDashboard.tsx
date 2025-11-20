import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import {
  School,
  Users,
  TrendingUp,
  Award,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  DollarSign,
  BookOpen,
  UserCheck,
  FileText,
  BarChart3,
  Target,
  Clock,
  GraduationCap,
  Plus,
  Eye
} from "lucide-react";

export function PrincipalDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showObservation, setShowObservation] = useState(false);

  // School Performance Metrics
  const schoolMetrics = [
    { title: "Total Students", value: "1,247", change: "+5.2%", icon: Users, color: "text-primary" },
    { title: "Average Attendance", value: "96.8%", change: "+2.1%", icon: UserCheck, color: "text-success" },
    { title: "Overall GPA", value: "3.45", change: "+0.15", icon: Award, color: "text-warning" },
    { title: "Staff Members", value: "87", change: "+3", icon: Users, color: "text-accent" }
  ];

  // Department Performance
  const departments = [
    { name: "Mathematics", head: "Dr. Johnson", teachers: 12, students: 340, avgGrade: 87, satisfaction: 92 },
    { name: "English", head: "Ms. Williams", teachers: 10, students: 340, avgGrade: 85, satisfaction: 89 },
    { name: "Science", head: "Dr. Chen", teachers: 14, students: 340, avgGrade: 88, satisfaction: 94 },
    { name: "Social Studies", head: "Mr. Davis", teachers: 8, students: 340, avgGrade: 84, satisfaction: 87 },
    { name: "Arts", head: "Ms. Martinez", teachers: 6, students: 200, avgGrade: 91, satisfaction: 96 }
  ];

  // Subject Performance Radar
  const subjectPerformance = [
    { subject: "Math", score: 87, fullMark: 100 },
    { subject: "English", score: 85, fullMark: 100 },
    { subject: "Science", score: 88, fullMark: 100 },
    { subject: "History", score: 84, fullMark: 100 },
    { subject: "Arts", score: 91, fullMark: 100 },
    { subject: "PE", score: 89, fullMark: 100 }
  ];

  // Monthly Trends
  const monthlyTrends = [
    { month: "Aug", enrollment: 1180, attendance: 94.5, gpa: 3.28 },
    { month: "Sep", enrollment: 1205, attendance: 95.2, gpa: 3.32 },
    { month: "Oct", enrollment: 1228, attendance: 96.1, gpa: 3.38 },
    { month: "Nov", enrollment: 1247, attendance: 96.8, gpa: 3.45 }
  ];

  // Teacher Observations
  const teacherObservations = [
    { teacher: "Ms. Johnson", subject: "Math 7A", date: "Today", status: "scheduled", score: null },
    { teacher: "Mr. Smith", subject: "English 9", date: "Yesterday", status: "completed", score: 4.5 },
    { teacher: "Dr. Wilson", subject: "Chemistry", date: "Last Week", status: "completed", score: 4.8 }
  ];

  // Important Alerts
  const alerts = [
    { type: "urgent", title: "Budget Review Due", message: "Q4 budget review meeting tomorrow at 2 PM", priority: "high" },
    { type: "info", title: "Accreditation Visit", message: "State accreditation team visit next week", priority: "high" },
    { type: "success", title: "Achievement", message: "School ranked #1 in district for Math performance", priority: "positive" }
  ];

  // Upcoming Events
  const upcomingEvents = [
    { title: "Staff Meeting", date: "Today", time: "3:30 PM", attendees: 87 },
    { title: "Parent Council Meeting", date: "Thursday", time: "6:00 PM", attendees: 25 },
    { title: "School Board Presentation", date: "Friday", time: "10:00 AM", attendees: 12 },
    { title: "Teacher Training Workshop", date: "Next Week", time: "All Day", attendees: 87 }
  ];

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 border-destructive/20';
      case 'medium': return 'bg-warning/10 border-warning/20';
      case 'positive': return 'bg-success/10 border-success/20';
      default: return 'bg-muted/10 border-muted/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Principal Dashboard</h1>
          <p className="text-muted-foreground">Lincoln High School Overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert('Opening calendar...')}>
            <Calendar className="h-4 w-4 mr-2" />
            School Calendar
          </Button>
          <Dialog open={showObservation} onOpenChange={setShowObservation}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Eye className="h-4 w-4 mr-2" />
                Teacher Observations
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Teacher Observation Schedule</DialogTitle>
                <DialogDescription>
                  Manage and review teacher classroom observations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {teacherObservations.map((obs, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{obs.teacher}</h3>
                        <p className="text-sm text-muted-foreground">{obs.subject}</p>
                      </div>
                      <Badge variant={obs.status === 'completed' ? 'default' : 'secondary'}>
                        {obs.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm">{obs.date}</span>
                      {obs.score && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Score:</span>
                          <Badge className="bg-success text-success-foreground">
                            {obs.score}/5.0
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="gradient" onClick={() => alert('Opening announcement creator...')}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {schoolMetrics.map((metric) => (
          <Card key={metric.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className={`h-3 w-3 ${metric.color}`} />
                <span className={metric.color}>{metric.change}</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Alerts */}
      <Card className="shadow-card bg-gradient-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Priority Items
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Actions requiring your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alerts.map((alert, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="font-medium mb-1">{alert.title}</div>
                <div className="text-sm opacity-80 mb-3">{alert.message}</div>
                <Button size="sm" variant="secondary">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Department Performance
            </CardTitle>
            <CardDescription>
              Overview of academic departments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.name} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium">{dept.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {dept.head} • {dept.teachers} teachers • {dept.students} students
                    </div>
                  </div>
                  <Badge variant="outline">{dept.avgGrade}% avg</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Performance</div>
                    <Progress value={dept.avgGrade} className="h-2" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Satisfaction</div>
                    <Progress value={dept.satisfaction} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subject Performance Radar */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Subject Performance Heatmap
            </CardTitle>
            <CardDescription>
              Comparative analysis across subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={subjectPerformance}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Performance" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Trends */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              School Performance Trends
            </CardTitle>
            <CardDescription>
              Enrollment, attendance, and GPA over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="enrollment" stroke="hsl(var(--primary))" strokeWidth={3} name="Enrollment" />
                <Line yAxisId="right" type="monotone" dataKey="attendance" stroke="hsl(var(--success))" strokeWidth={3} name="Attendance %" />
                <Line yAxisId="right" type="monotone" dataKey="gpa" stroke="hsl(var(--warning))" strokeWidth={3} name="GPA" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Your schedule and commitments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {event.attendees} attendees
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{event.date}</div>
                  <div className="text-xs text-muted-foreground">{event.time}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Principal Tools</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => setShowObservation(true)}>
              <UserCheck className="h-8 w-8" />
              <span className="text-sm">Teacher Observations</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => alert('Opening budget dashboard...')}>
              <DollarSign className="h-8 w-8" />
              <span className="text-sm">Budget Overview</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => alert('Opening reports center...')}>
              <FileText className="h-8 w-8" />
              <span className="text-sm">Reports</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => alert('Opening parent communication...')}>
              <MessageSquare className="h-8 w-8" />
              <span className="text-sm">Parent Communications</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
