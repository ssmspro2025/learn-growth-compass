import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  GraduationCap,
  Eye,
  Phone,
  Mail
} from "lucide-react";

export function ParentDashboard() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const children = [
    { 
      name: "Alex Chen", 
      grade: "7th Grade", 
      school: "Lincoln Middle School",
      gpa: 3.7,
      attendance: 96,
      recentGrades: [{ subject: "Math", grade: "A-" }, { subject: "English", grade: "B+" }],
      nextEvent: "Parent-Teacher Conference - Friday 3:00 PM"
    },
    { 
      name: "Emma Chen", 
      grade: "4th Grade", 
      school: "Lincoln Elementary",
      gpa: 3.9,
      attendance: 98,
      recentGrades: [{ subject: "Reading", grade: "A" }, { subject: "Science", grade: "A-" }],
      nextEvent: "Field Trip Permission Due - Wednesday"
    }
  ];

  const progressData = [
    { month: "Sep", alex: 3.5, emma: 3.8 },
    { month: "Oct", alex: 3.6, emma: 3.9 },
    { month: "Nov", alex: 3.7, emma: 3.9 },
  ];

  const attendanceData = [
    { month: "Sep", alex: 94, emma: 96 },
    { month: "Oct", alex: 95, emma: 98 },
    { month: "Nov", alex: 96, emma: 98 },
  ];

  const alerts = [
    { type: "fee", title: "Fee Payment Due", message: "Alex's lunch fee payment due in 3 days", priority: "high" },
    { type: "attendance", title: "Absence Notice", message: "Emma was absent yesterday - illness reported", priority: "medium" },
    { type: "achievement", title: "Achievement Alert", message: "Alex received Student of the Month award!", priority: "positive" }
  ];

  const upcomingEvents = [
    { title: "Parent-Teacher Conference", child: "Alex Chen", date: "Friday, Mar 15", time: "3:00 PM" },
    { title: "Science Fair", child: "Emma Chen", date: "Monday, Mar 18", time: "All Day" },
    { title: "Spring Break", child: "Both", date: "Apr 1-5", time: "No School" }
  ];

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/10 border-warning/20 text-warning';
      case 'positive': return 'bg-success/10 border-success/20 text-success';
      default: return 'bg-muted/10 border-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Family Dashboard</h1>
          <p className="text-muted-foreground">Stay connected with your children's education</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert('Opening meeting scheduler...')}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Dialog open={showPayment} onOpenChange={setShowPayment}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <DollarSign className="h-4 w-4 mr-2" />
                Fee Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fee Payment Center</DialogTitle>
                <DialogDescription>
                  Pay outstanding fees for your children
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {children.map((child) => (
                  <div key={child.name} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">{child.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tuition Fee</span>
                        <span className="font-medium">$850.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Activity Fee</span>
                        <span className="font-medium">$150.00</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Due</span>
                        <span>$1000.00</span>
                      </div>
                      <Button className="w-full mt-2">Pay Now</Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="gradient" onClick={() => alert('Opening teacher contact form...')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Teacher
          </Button>
        </div>
      </div>

      {/* Children Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <Card key={child.name} className="shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{child.name}</CardTitle>
                  <CardDescription>{child.grade} • {child.school}</CardDescription>
                </div>
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Academic Performance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-success">{child.gpa}</div>
                  <div className="text-sm text-muted-foreground">GPA</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{child.attendance}%</div>
                  <div className="text-sm text-muted-foreground">Attendance</div>
                </div>
              </div>

              {/* Recent Grades */}
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Grades</h4>
                <div className="space-y-2">
                  {child.recentGrades.map((grade, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{grade.subject}</span>
                      <Badge variant={grade.grade.startsWith('A') ? 'default' : 'secondary'}>
                        {grade.grade}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Event */}
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span className="font-medium">Next:</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{child.nextEvent}</div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{child.name} - Complete Profile</DialogTitle>
                    <DialogDescription>
                      Comprehensive view of your child's academic progress
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-success">{child.gpa}</div>
                        <div className="text-sm text-muted-foreground">Current GPA</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">{child.attendance}%</div>
                        <div className="text-sm text-muted-foreground">Attendance</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-warning">5</div>
                        <div className="text-sm text-muted-foreground">Assignments Due</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Activity</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Math Quiz Score</span>
                          <span className="font-medium">92%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Science Project Grade</span>
                          <span className="font-medium">A-</span>
                        </div>
                        <div className="flex justify-between">
                          <span>English Essay</span>
                          <span className="font-medium">B+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts & Notifications */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Important Alerts
            </CardTitle>
            <CardDescription>
              Updates requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-3 border rounded-lg ${getAlertColor(alert.priority)}`}>
                <div className="flex items-start gap-3">
                  {alert.priority === 'positive' ? (
                    <CheckCircle className="h-4 w-4 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm opacity-80 mt-1">{alert.message}</div>
                    {alert.priority !== 'positive' && (
                      <Button size="sm" variant="outline" className="mt-2">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
              Important dates and meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">{event.child}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{event.date}</div>
                  <div className="text-xs text-muted-foreground">{event.time}</div>
                </div>
              </div>
            ))}
            <Button className="w-full" variant="outline">
              View Full Calendar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common parent portal tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => setShowPayment(true)}
            >
              <DollarSign className="h-8 w-8" />
              <span className="text-sm">Pay Fees</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Opening teacher messaging system...')}
            >
              <MessageSquare className="h-8 w-8" />
              <span className="text-sm">Message Teacher</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Viewing children assignments...')}
            >
              <BookOpen className="h-8 w-8" />
              <span className="text-sm">View Assignments</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col h-auto p-4 gap-2 hover-scale"
              onClick={() => alert('Generating attendance report...')}
            >
              <Clock className="h-8 w-8" />
              <span className="text-sm">Attendance Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}