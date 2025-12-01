import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ParentLayout from '@/components/ParentLayout';
import ConversationList from '@/components/chat/ConversationList';
import ChatInterface from '@/components/chat/ChatInterface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Student {
  id: string;
  name: string;
}

export default function ParentMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user?.student_id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('id', user.student_id);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', getErrorMessage(error));
    }
  };

  const createConversation = async () => {
    if (!selectedStudentId || !user?.center_id) return;

    setCreating(true);
    try {
      // Check if conversation already exists
      const { data: existing, error: existingError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('center_id', user.center_id)
        .eq('parent_user_id', user.id)
        .eq('student_id', selectedStudentId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const student = students.find((s) => s.id === selectedStudentId);
        setSelectedConversation({
          id: existing.id,
          name: `${user.center_name} - ${student?.name}`,
        });
        setDialogOpen(false);
        return;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          center_id: user.center_id,
          parent_user_id: user.id,
          student_id: selectedStudentId,
        })
        .select()
        .single();

      if (error) throw error;

      const student = students.find((s) => s.id === selectedStudentId);
      setSelectedConversation({
        id: data.id,
        name: `${user.center_name} - ${student?.name}`,
      });
      setDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Conversation started',
      });
    } catch (error) {
      console.error('Error creating conversation:', getErrorMessage(error));
      toast({
        title: 'Error',
        description: `Failed to start conversation: ${getErrorMessage(error)}`,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <ParentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Messages</h1>
            <p className="text-muted-foreground mt-2">Chat with your child's center</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Student</label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={createConversation}
                  disabled={!selectedStudentId || creating}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    'Start Chat'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="h-[calc(100vh-240px)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-border">
              <ConversationList
                onSelectConversation={(id, name) =>
                  setSelectedConversation({ id, name })
                }
                selectedConversationId={selectedConversation?.id}
              />
            </div>

            {/* Chat Interface */}
            <div className="md:col-span-2">
              {selectedConversation ? (
                <ChatInterface
                  conversationId={selectedConversation.id}
                  recipientName={selectedConversation.name}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a conversation or start a new one
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </ParentLayout>
  );
}
