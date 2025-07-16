import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Monitor,
  Activity,
  Database,
  Server,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Code,
  Globe,
  Settings,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  Shield
} from "lucide-react";

export function DeveloperDashboard() {
  const systemMetrics = [
    { title: "API Response Time", value: "245ms", status: "good", trend: "+2.1%", icon: Activity },
    { title: "Active Users", value: "1,247", status: "excellent", trend: "+5.7%", icon: Users },
    { title: "System Uptime", value: "99.9%", status: "excellent", trend: "0%", icon: Server },
    { title: "Database Load", value: "67%", status: "warning", trend: "+12%", icon: Database }
  ];

  const tenants = [
    { name: "Lincoln School District", users: 485, status: "active", usage: 78, lastActive: "2 mins ago" },
    { name: "Washington Academy", users: 234, status: "active", usage: 92, lastActive: "5 mins ago" },
    { name: "Roosevelt High School", users: 678, status: "maintenance", usage: 45, lastActive: "1 hour ago" },
    { name: "Jefferson Elementary", users: 156, status: "active", usage: 83, lastActive: "1 min ago" }
  ];

  const recentDeployments = [
    { version: "v2.4.1", feature: "Enhanced Student Analytics", status: "success", time: "2 hours ago" },
    { version: "v2.4.0", feature: "AI-Powered Insights", status: "success", time: "1 day ago" },
    { version: "v2.3.9", feature: "Mobile App Updates", status: "rollback", time: "3 days ago" },
    { version: "v2.3.8", feature: "Security Patches", status: "success", time: "1 week ago" }
  ];

  const alerts = [
    { type: "error", title: "High Memory Usage", message: "Node-3 memory usage above 85%", severity: "high" },
    { type: "warning", title: "Slow Query Detected", message: "Reports query taking >5s", severity: "medium" },
    { type: "info", title: "Scheduled Maintenance", message: "Database backup at 2:00 AM", severity: "low" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-primary';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getDeploymentColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success text-success-foreground';
      case 'rollback': return 'bg-destructive text-destructive-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 border-destructive/20';
      case 'medium': return 'bg-warning/10 border-warning/20';
      case 'low': return 'bg-primary/10 border-primary/20';
      default: return 'bg-muted/10 border-muted/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Control Center</h1>
          <p className="text-muted-foreground">Monitor and manage the EduManage infrastructure</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Logs</Button>
          <Button variant="secondary">System Health</Button>
          <Button variant="gradient">Deploy Update</Button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric) => (
          <Card key={metric.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className={`h-3 w-3 ${getStatusColor(metric.status)}`} />
                <span className={getStatusColor(metric.status)}>{metric.trend}</span>
                <span className="text-muted-foreground">vs last hour</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Management */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Multi-Tenant Status
            </CardTitle>
            <CardDescription>
              Active tenant organizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenants.map((tenant) => (
              <div key={tenant.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {tenant.users} users • {tenant.lastActive}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">{tenant.usage}%</div>
                    <Progress value={tenant.usage} className="w-20" />
                  </div>
                  <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                    {tenant.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>
              Issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-3 border rounded-lg ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm opacity-80 mt-1">{alert.message}</div>
                    <Button size="sm" variant="outline" className="mt-2">
                      Investigate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployment History */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Recent Deployments
            </CardTitle>
            <CardDescription>
              Latest system updates and releases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDeployments.map((deployment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{deployment.version}</div>
                  <div className="text-sm text-muted-foreground">{deployment.feature}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{deployment.time}</span>
                  <Badge className={getDeploymentColor(deployment.status)}>
                    {deployment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Infrastructure Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Infrastructure Health
            </CardTitle>
            <CardDescription>
              Server and service status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                <Cpu className="h-8 w-8 text-success" />
                <div>
                  <div className="text-sm font-medium">CPU Usage</div>
                  <div className="text-xs text-muted-foreground">45% Average</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <HardDrive className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-sm font-medium">Storage</div>
                  <div className="text-xs text-muted-foreground">2.1TB Available</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                <Wifi className="h-8 w-8 text-success" />
                <div>
                  <div className="text-sm font-medium">Network</div>
                  <div className="text-xs text-muted-foreground">All Endpoints Up</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <Shield className="h-8 w-8 text-warning" />
                <div>
                  <div className="text-sm font-medium">Security</div>
                  <div className="text-xs text-muted-foreground">2 Pending Updates</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Developer Tools</CardTitle>
          <CardDescription>
            System administration and monitoring tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <BarChart3 className="h-8 w-8" />
              <span className="text-sm">Analytics</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <Database className="h-8 w-8" />
              <span className="text-sm">DB Console</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <Monitor className="h-8 w-8" />
              <span className="text-sm">Monitoring</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2">
              <Settings className="h-8 w-8" />
              <span className="text-sm">Config</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}