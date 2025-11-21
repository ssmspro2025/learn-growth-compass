import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Eye, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  student_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
}

const InvoiceManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    student_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });

  useEffect(() => {
    if (user?.center_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students
      const { data: studentData } = await supabase
        .from('students')
        .select('id, name')
        .eq('center_id', user?.center_id);

      setStudents(studentData || []);

      // Fetch invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('center_id', user?.center_id)
        .order('invoice_date', { ascending: false });

      if (invoiceData) {
        // Enrich with student names
        const enrichedInvoices = await Promise.all(
          invoiceData.map(async (inv) => {
            const student = studentData?.find((s) => s.id === inv.student_id);
            return {
              ...inv,
              student_name: student?.name || 'Unknown',
            };
          })
        );
        setInvoices(enrichedInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.student_id || !newInvoice.due_date || !user?.center_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get student's fee structure
      const { data: feeAssignment } = await supabase
        .from('student_fee_assignments')
        .select('fee_structure_id')
        .eq('student_id', newInvoice.student_id)
        .single();

      if (!feeAssignment) {
        toast({
          title: 'Error',
          description: 'No fee structure assigned to this student',
          variant: 'destructive',
        });
        return;
      }

      // Get fee items and calculate total
      const { data: feeItems } = await supabase
        .from('fee_structure_items')
        .select('fee_heading_id, amount')
        .eq('fee_structure_id', feeAssignment.fee_structure_id);

      let totalAmount = 0;
      feeItems?.forEach((item: any) => {
        totalAmount += parseFloat(item.amount);
      });

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}`;
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          center_id: user.center_id,
          student_id: newInvoice.student_id,
          invoice_number: invoiceNumber,
          invoice_date: newInvoice.invoice_date,
          due_date: newInvoice.due_date,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          status: 'due',
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const items = feeItems?.map((item: any) => ({
        invoice_id: invoice.id,
        fee_heading_id: item.fee_heading_id,
        amount: item.amount,
      })) || [];

      if (items.length > 0) {
        await supabase.from('invoice_items').insert(items);
      }

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });

      setNewInvoice({
        student_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
      });

      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'due':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Manage student invoices</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Manual Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newInvoice.student_id}
                    onChange={(e) => setNewInvoice({ ...newInvoice, student_id: e.target.value })}
                  >
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={newInvoice.invoice_date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, invoice_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreateInvoice} className="w-full">
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Invoice #</th>
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Due Date</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                  <td className="py-3 px-4">{invoice.student_name}</td>
                  <td className="py-3 px-4">₹{invoice.total_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">{invoice.due_date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceManager;
