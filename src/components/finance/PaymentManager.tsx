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
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  student_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  status: string;
}

const PaymentManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Array<{ id: string; invoice_number: string; student_name: string; remaining_amount: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [newPayment, setNewPayment] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.center_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pending invoices
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('id, invoice_number, student_id, remaining_amount')
        .eq('center_id', user?.center_id)
        .in('status', ['due', 'partial', 'overdue']);

      if (invoiceData) {
        // Enrich with student names
        const { data: students } = await supabase
          .from('students')
          .select('id, name');

        const enriched = invoiceData.map((inv: any) => {
          const student = students?.find((s: any) => s.id === inv.student_id);
          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            student_name: student?.name || 'Unknown',
            remaining_amount: inv.remaining_amount,
          };
        });

        setInvoices(enriched);
      }

      // Fetch payments
      const { data: paymentData } = await supabase
        .from('payments')
        .select('id, invoice_id, amount, payment_date, payment_method, reference_number, payment_status')
        .eq('center_id', user?.center_id)
        .order('payment_date', { ascending: false });

      if (paymentData) {
        const enrichedPayments = await Promise.all(
          paymentData.map(async (pmt: any) => {
            const inv = invoiceData?.find((i: any) => i.id === pmt.invoice_id);
            const student = students?.find((s: any) => s.id === (invoiceData?.find((i: any) => i.id === pmt.invoice_id)?.student_id));
            return {
              ...pmt,
              invoice_number: inv?.invoice_number || 'Unknown',
              student_name: student?.name || 'Unknown',
              status: pmt.payment_status,
            };
          })
        );

        setPayments(enrichedPayments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!newPayment.invoice_id || !newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const invoice = invoices.find((i) => i.id === newPayment.invoice_id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const amount = parseFloat(newPayment.amount);
      if (amount > invoice.remaining_amount) {
        toast({
          title: 'Error',
          description: `Amount cannot exceed remaining balance of ₹${invoice.remaining_amount.toFixed(2)}`,
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          invoiceId: newPayment.invoice_id,
          studentId: invoices.find((i) => i.id === newPayment.invoice_id),
          centerId: user?.center_id,
          amount: amount,
          paymentMethod: newPayment.payment_method,
          referenceNumber: newPayment.reference_number,
          notes: newPayment.notes,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment processed successfully',
      });

      setNewPayment({
        invoice_id: '',
        amount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
      });

      fetchData();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>Record and manage student payments</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Invoice</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newPayment.invoice_id}
                    onChange={(e) => setNewPayment({ ...newPayment, invoice_id: e.target.value })}
                  >
                    <option value="">Select Invoice</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.student_name} (Remaining: ₹{inv.remaining_amount.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <Label>Payment Method</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={newPayment.payment_method}
                    onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="online">Online Transfer</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={newPayment.reference_number}
                    onChange={(e) => setNewPayment({ ...newPayment, reference_number: e.target.value })}
                    placeholder="Cheque/Transaction ID"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Input
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <Button onClick={handleProcessPayment} className="w-full">
                  Record Payment
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
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Invoice #</th>
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="py-3 px-4">{payment.payment_date}</td>
                  <td className="py-3 px-4 font-medium">{payment.invoice_number}</td>
                  <td className="py-3 px-4">{payment.student_name}</td>
                  <td className="py-3 px-4">₹{payment.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 capitalize">{payment.payment_method}</td>
                  <td className="py-3 px-4">{payment.reference_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentManager;
