import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Home, BookOpen, CheckSquare, Users, CalendarDays, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Fetch upcoming meetings for this teacher
  const { data: teacherMeetings = [] } = useQuery({
    queryKey: ["teacher-dashboard-meetings", user?.teacher_id],
    queryFn: async () => {
      if (!user?.teacher_id) return [];
      const { data, error } = await supabase
        .from("meeting_attendees")
        .select(`
          *,
          meetings(id, title, description, meeting_date, meeting_type, status)
        `)
        .eq("teacher_id", user.teacher_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data?.filter((att: any) => att.meetings && att.meetings.status === 'scheduled') || [];
    },
    enabled: !!user?.teacher_id,
  });

  // Fetch upcoming events for this center
  const { data: centerEvents = [] } = useQuery({
    queryKey: ["teacher-center-events", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from("center_events")
        .select("*")
        .eq("center_id", user.center_id)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.username}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is your personalized dashboard. Use the sidebar to access your assigned features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {user?.teacherPermissions?.take_attendance && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Take Attendance</CardTitle>
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Mark student presence.</p>
                </CardContent>
              </Card>
            )}
            {user?.teacherPermissions?.lesson_tracking && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lesson Tracking</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Record lessons taught.</p>
                </CardContent>
              </Card>
            )}
            {user?.teacherPermissions?.student_report_access && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Student Reports</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">View student performance reports.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings Section */}
      {teacherMeetings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherMeetings.slice(0, 5).map((attendee: any) => (
                  <TableRow key={attendee.id}>
                    <TableCell className="font-medium">{attendee.meetings?.title}</TableCell>
                    <TableCell>{format(new Date(attendee.meetings?.meeting_date), "PPP")}</TableCell>
                    <TableCell>{format(new Date(attendee.meetings?.meeting_date), "p")}</TableCell>
                    <TableCell>{attendee.meetings?.meeting_type?.charAt(0).toUpperCase() + attendee.meetings?.meeting_type?.slice(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events Section */}
      {centerEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {centerEvents.map((event: any) => (
                <div key={event.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{format(new Date(event.event_date), "PPP")}</p>
                    {event.is_holiday && <span className="text-xs text-red-600 font-medium">Holiday</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}