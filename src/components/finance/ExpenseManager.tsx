import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ExpenseCategory {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  expense_category_id: string;
  category_name: string;
  amount: number;
  description: string;
  expense_date: string;
  reference_number: string;
}

const ExpenseManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newExpense, setNewExpense] = useState({
    expense_category_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    payment_method: 'cash',
  });

  useEffect(() => {
    if (user?.center_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const { data: catData } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('center_id', user?.center_id)
        .eq('is_active', true);

      setCategories(catData || []);

      // Fetch expenses
      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .eq('center_id', user?.center_id)
        .order('expense_date', { ascending: false });

      if (expData) {
        const enriched = expData.map((exp: any) => {
          const cat = catData?.find((c: any) => c.id === exp.expense_category_id);
          return {
            ...exp,
            category_name: cat?.name || 'Unknown',
          };
        });
        setExpenses(enriched);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !user?.center_id) return;

    try {
      const { error } = await supabase.from('expense_categories').insert({
        center_id: user.center_id,
        name: newCategory.name,
        description: newCategory.description,
      });

      if (error) throw error;

      setNewCategory({ name: '', description: '' });
      fetchData();
      toast({
        title: 'Success',
        description: 'Category added successfully',
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category',
        variant: 'destructive',
      });
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.expense_category_id || !newExpense.amount || !user?.center_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('expenses').insert({
        center_id: user.center_id,
        expense_category_id: newExpense.expense_category_id,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        expense_date: newExpense.expense_date,
        reference_number: newExpense.reference_number,
        payment_method: newExpense.payment_method,
        created_by: user.id,
      });

      if (error) throw error;

      // Create ledger entry
      await supabase.from('ledger_entries').insert({
        center_id: user.center_id,
        entry_type: 'expense',
        amount: parseFloat(newExpense.amount),
        entry_date: newExpense.expense_date,
        description: `Expense: ${newExpense.description}`,
      });

      setNewExpense({
        expense_category_id: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        payment_method: 'cash',
      });

      fetchData();
      toast({
        title: 'Success',
        description: 'Expense recorded successfully',
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to record expense',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

      if (error) throw error;

      fetchData();
      toast({
        title: 'Success',
        description: 'Expense deleted',
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum) => sum + (expenses.length > 0 ? expenses[0].amount : 0), 0);

  return (
    <div className="space-y-6">
      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Expense Categories</CardTitle>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category Name</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Staff Salary"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <Button onClick={handleAddCategory} className="w-full">
                    Save Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{cat.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Record and manage expenses</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={newExpense.expense_category_id}
                      onChange={(e) => setNewExpense({ ...newExpense, expense_category_id: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="Amount"
                    />
                  </div>

                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={newExpense.payment_method}
                      onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="online">Online</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <Label>Reference Number</Label>
                    <Input
                      value={newExpense.reference_number}
                      onChange={(e) => setNewExpense({ ...newExpense, reference_number: e.target.value })}
                      placeholder="Reference/Bill No"
                    />
                  </div>

                  <Button onClick={handleAddExpense} className="w-full">
                    Save Expense
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
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b">
                    <td className="py-3 px-4">{expense.expense_date}</td>
                    <td className="py-3 px-4">{expense.category_name}</td>
                    <td className="py-3 px-4">{expense.description}</td>
                    <td className="py-3 px-4 font-medium">₹{expense.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseManager;
