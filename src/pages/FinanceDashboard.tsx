import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import FeeStructureManager from '@/components/finance/FeeStructureManager';
import InvoiceManager from '@/components/finance/InvoiceManager';
import PaymentManager from '@/components/finance/PaymentManager';
import ExpenseManager from '@/components/finance/ExpenseManager';
import FinanceAnalytics from '@/components/finance/FinanceAnalytics';
import { useAuth } from '@/contexts/AuthContext';

const FinanceDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalDues: 0,
    netBalance: 0,
    invoicesPending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user?.center_id) return;

        // Fetch total invoices amount
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount, status')
          .eq('center_id', user.center_id);

        // Fetch total expenses
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('center_id', user.center_id);

        let totalRevenue = 0;
        let totalPaid = 0;
        let invoicesPending = 0;

        if (invoices) {
          invoices.forEach((inv: any) => {
            totalRevenue += inv.total_amount;
            totalPaid += inv.paid_amount;
            if (inv.status === 'due' || inv.status === 'overdue') invoicesPending++;
          });
        }

        const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0;
        const totalDues = totalRevenue - totalPaid;
        const netBalance = totalPaid - totalExpenses;

        setStats({
          totalRevenue,
          totalExpenses,
          totalDues,
          netBalance,
          invoicesPending,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold">Finance Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage finances, invoices, and expenses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <DollarSign className="h-4 w-4 text-green-600 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalRevenue - stats.totalDues).toFixed(2)}</div>
            <TrendingUp className="h-4 w-4 text-blue-600 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{stats.totalDues.toFixed(2)}</div>
            <AlertCircle className="h-4 w-4 text-red-600 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalExpenses.toFixed(2)}</div>
            <AlertCircle className="h-4 w-4 text-orange-600 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats.netBalance.toFixed(2)}
            </div>
            <Calendar className="h-4 w-4 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="fees">Fee Structure</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <InvoiceManager />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentManager />
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <FeeStructureManager />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <FinanceAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceDashboard;
