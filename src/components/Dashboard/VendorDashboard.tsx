import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Truck,
  MessageSquare,
  Calendar,
  ShoppingCart,
  Archive,
  Download,
  Eye,
  Plus
} from "lucide-react";

export function VendorDashboard() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Vendor Performance Metrics
  const metrics = [
    { title: "Active Orders", value: "24", change: "+3", icon: ShoppingCart, color: "text-primary" },
    { title: "Pending Payment", value: "$18,450", change: "+$2,340", icon: DollarSign, color: "text-warning" },
    { title: "Completed Orders", value: "142", change: "+12", icon: CheckCircle, color: "text-success" },
    { title: "Response Time", value: "2.4h", change: "-0.3h", icon: Clock, color: "text-accent" }
  ];

  // Active Purchase Orders
  const orders = [
    { 
      id: "PO-2024-0421", 
      school: "Lincoln High School", 
      items: "Science Lab Equipment", 
      amount: 3450.00, 
      status: "processing", 
      dueDate: "Mar 20, 2024",
      quantity: 12
    },
    { 
      id: "PO-2024-0418", 
      school: "Washington Academy", 
      items: "Sports Equipment", 
      amount: 2890.00, 
      status: "shipped", 
      dueDate: "Mar 18, 2024",
      quantity: 25
    },
    { 
      id: "PO-2024-0415", 
      school: "Roosevelt Elementary", 
      items: "Art Supplies", 
      amount: 1275.00, 
      status: "delivered", 
      dueDate: "Mar 15, 2024",
      quantity: 45
    },
    { 
      id: "PO-2024-0412", 
      school: "Jefferson Middle School", 
      items: "Technology Hardware", 
      amount: 8950.00, 
      status: "pending", 
      dueDate: "Mar 25, 2024",
      quantity: 8
    }
  ];

  // Monthly Revenue
  const revenueData = [
    { month: "Aug", revenue: 45200, orders: 38 },
    { month: "Sep", revenue: 52100, orders: 42 },
    { month: "Oct", revenue: 48900, orders: 40 },
    { month: "Nov", revenue: 59300, orders: 48 }
  ];

  // Order Volume by Category
  const categoryData = [
    { category: "Lab Equipment", value: 35, revenue: 18400 },
    { category: "Sports Gear", value: 25, revenue: 12300 },
    { category: "Technology", value: 20, revenue: 24100 },
    { category: "Art Supplies", value: 15, revenue: 8200 },
    { category: "Furniture", value: 5, revenue: 15300 }
  ];

  // Recent Invoices
  const invoices = [
    { id: "INV-2024-1234", order: "PO-2024-0415", amount: 1275.00, status: "paid", date: "Mar 16, 2024" },
    { id: "INV-2024-1233", order: "PO-2024-0410", amount: 3200.00, status: "paid", date: "Mar 12, 2024" },
    { id: "INV-2024-1232", order: "PO-2024-0405", amount: 4850.00, status: "overdue", date: "Mar 8, 2024" },
    { id: "INV-2024-1231", order: "PO-2024-0402", amount: 2100.00, status: "pending", date: "Mar 5, 2024" }
  ];

  // Support Tickets
  const tickets = [
    { id: "TKT-445", school: "Lincoln High", issue: "Missing items in shipment", priority: "high", status: "open" },
    { id: "TKT-444", school: "Washington Academy", issue: "Product quality question", priority: "medium", status: "open" },
    { id: "TKT-443", school: "Roosevelt Elementary", issue: "Invoice clarification", priority: "low", status: "resolved" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-primary text-primary-foreground';
      case 'shipped': return 'bg-accent text-accent-foreground';
      case 'delivered': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Portal</h1>
          <p className="text-muted-foreground">Manage orders and track your business</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => alert('Opening order catalog...')}>
            <Package className="h-4 w-4 mr-2" />
            Product Catalog
          </Button>
          <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <FileText className="h-4 w-4 mr-2" />
                View Invoices
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Invoice Management</DialogTitle>
                <DialogDescription>
                  Track and manage your invoices and payments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{invoice.id}</div>
                      <div className="text-sm text-muted-foreground">Order: {invoice.order}</div>
                      <div className="text-xs text-muted-foreground">{invoice.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">${invoice.amount.toFixed(2)}</div>
                        <Badge className={getInvoiceStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="gradient" onClick={() => alert('Creating new order...')}>
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
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
                <span className="text-muted-foreground">this month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Orders */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Active Purchase Orders
          </CardTitle>
          <CardDescription>
            Current orders in your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{order.id}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{order.school}</div>
                  <div className="text-sm font-medium mt-1">{order.items}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">${order.amount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{order.quantity} items</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Due: {order.dueDate}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Order Details - {order.id}</DialogTitle>
                        <DialogDescription>
                          Complete order information and tracking
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="text-sm text-muted-foreground">School</div>
                            <div className="font-medium">{order.school}</div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="text-sm text-muted-foreground">Amount</div>
                            <div className="font-medium text-primary">${order.amount.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-2">Items</div>
                          <div className="font-medium">{order.items}</div>
                          <div className="text-sm text-muted-foreground mt-1">Quantity: {order.quantity}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Due Date: {order.dueDate}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {order.status === 'processing' && (
                    <Button size="sm" variant="secondary">
                      <Truck className="h-4 w-4 mr-1" />
                      Ship
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue & Order Volume
            </CardTitle>
            <CardDescription>
              Monthly performance tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={3} name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={3} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Sales by Category
            </CardTitle>
            <CardDescription>
              Product category breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Tickets
          </CardTitle>
          <CardDescription>
            Customer inquiries and issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{ticket.id}</span>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{ticket.school}</div>
                <div className="text-sm mt-1">{ticket.issue}</div>
              </div>
              <Button size="sm" variant="outline">
                Respond
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Vendor Tools</CardTitle>
          <CardDescription>
            Common vendor portal tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => alert('Managing product catalog...')}>
              <Package className="h-8 w-8" />
              <span className="text-sm">Manage Products</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => setShowInvoice(true)}>
              <FileText className="h-8 w-8" />
              <span className="text-sm">Invoices</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => alert('Tracking shipments...')}>
              <Truck className="h-8 w-8" />
              <span className="text-sm">Shipment Tracking</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto p-4 gap-2 hover-scale" onClick={() => alert('Opening support center...')}>
              <MessageSquare className="h-8 w-8" />
              <span className="text-sm">Support Center</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
