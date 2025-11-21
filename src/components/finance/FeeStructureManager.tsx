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
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FeeHeading {
  id: string;
  name: string;
  description: string;
}

interface FeeStructure {
  id: string;
  grade: string;
  name: string;
  items: Array<{
    id: string;
    fee_heading_id: string;
    amount: number;
  }>;
}

const FeeStructureManager = () => {
  const { user } = useAuth();
  const [feeHeadings, setFeeHeadings] = useState<FeeHeading[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [newHeading, setNewHeading] = useState({ name: '', description: '' });
  const [newStructure, setNewStructure] = useState({
    grade: '',
    name: '',
    items: [] as Array<{ fee_heading_id: string; amount: string }>,
  });

  useEffect(() => {
    if (user?.center_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const centerId = user?.center_id;

      // Fetch fee headings
      const { data: headings } = await supabase
        .from('fee_headings')
        .select('*')
        .eq('center_id', centerId)
        .eq('is_active', true);

      setFeeHeadings(headings || []);

      // Fetch fee structures with items
      const { data: structures } = await supabase
        .from('fee_structures')
        .select(
          `
          id,
          grade,
          name,
          fee_structure_items (
            id,
            fee_heading_id,
            amount
          )
        `
        )
        .eq('center_id', centerId)
        .eq('is_active', true);

      setFeeStructures(structures as any || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHeading = async () => {
    if (!newHeading.name || !user?.center_id) return;

    try {
      const { error } = await supabase.from('fee_headings').insert({
        center_id: user.center_id,
        name: newHeading.name,
        description: newHeading.description,
      });

      if (error) throw error;
      setNewHeading({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding fee heading:', error);
    }
  };

  const handleAddStructure = async () => {
    if (!newStructure.grade || !newStructure.name || !user?.center_id) return;

    try {
      const { data: structure, error: structureError } = await supabase
        .from('fee_structures')
        .insert({
          center_id: user.center_id,
          grade: newStructure.grade,
          name: newStructure.name,
        })
        .select()
        .single();

      if (structureError) throw structureError;

      // Add structure items
      const items = newStructure.items
        .filter((item) => item.fee_heading_id && item.amount)
        .map((item) => ({
          fee_structure_id: structure.id,
          fee_heading_id: item.fee_heading_id,
          amount: parseFloat(item.amount),
        }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('fee_structure_items').insert(items);
        if (itemsError) throw itemsError;
      }

      setNewStructure({ grade: '', name: '', items: [] });
      fetchData();
    } catch (error) {
      console.error('Error adding fee structure:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fee Headings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fee Headings</CardTitle>
              <CardDescription>Manage fee categories</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Heading
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Fee Heading</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newHeading.name}
                      onChange={(e) => setNewHeading({ ...newHeading, name: e.target.value })}
                      placeholder="e.g., Tuition Fee"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newHeading.description}
                      onChange={(e) => setNewHeading({ ...newHeading, description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <Button onClick={handleAddHeading} className="w-full">
                    Save Heading
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {feeHeadings.map((heading) => (
              <div key={heading.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{heading.name}</p>
                  <p className="text-sm text-gray-600">{heading.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fee Structures */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fee Structures by Grade</CardTitle>
              <CardDescription>Define fee structure for each grade</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Structure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Fee Structure</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Grade</Label>
                      <Input
                        value={newStructure.grade}
                        onChange={(e) => setNewStructure({ ...newStructure, grade: e.target.value })}
                        placeholder="e.g., Class 5"
                      />
                    </div>
                    <div>
                      <Label>Structure Name</Label>
                      <Input
                        value={newStructure.name}
                        onChange={(e) => setNewStructure({ ...newStructure, name: e.target.value })}
                        placeholder="e.g., Standard Structure"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Fee Items</Label>
                    <div className="space-y-2">
                      {newStructure.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <select
                            className="flex-1 px-3 py-2 border rounded-md"
                            value={item.fee_heading_id}
                            onChange={(e) => {
                              const items = [...newStructure.items];
                              items[idx].fee_heading_id = e.target.value;
                              setNewStructure({ ...newStructure, items });
                            }}
                          >
                            <option value="">Select Fee Heading</option>
                            {feeHeadings.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            className="w-32"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => {
                              const items = [...newStructure.items];
                              items[idx].amount = e.target.value;
                              setNewStructure({ ...newStructure, items });
                            }}
                          />
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const items = newStructure.items.filter((_, i) => i !== idx);
                              setNewStructure({ ...newStructure, items });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewStructure({
                            ...newStructure,
                            items: [...newStructure.items, { fee_heading_id: '', amount: '' }],
                          });
                        }}
                        className="w-full"
                      >
                        Add Item
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleAddStructure} className="w-full">
                    Save Structure
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeStructures.map((structure) => (
              <div key={structure.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{structure.name}</h3>
                    <p className="text-sm text-gray-600">{structure.grade}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {structure.items.map((item, idx) => {
                    const heading = feeHeadings.find((h) => h.id === item.fee_heading_id);
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{heading?.name || 'Unknown'}</span>
                        <span className="font-medium">₹{item.amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>
                      ₹
                      {structure.items
                        .reduce((sum: number, item: any) => sum + item.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeStructureManager;
