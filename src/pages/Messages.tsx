"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Plus, Users, Megaphone, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";

type MessageType = 'individual' | 'group' | 'broadcast';

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>('individual');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<'parents' | 'teachers' | 'all'>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch students (for parent messaging)
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-messages", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, name, grade")
        .eq("center_id", user.center_id)
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-messages", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name")
        .eq("center_id", user.center_id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["center-messages", user?.center_id],
    queryFn: async () => {
      if (!user?.center_id) return [];
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          students(id, name)
        `)
        .eq("center_id", user.center_id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.center_id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientIds, text, isBroadcast }: { recipientIds: string[], text: string, isBroadcast: boolean }) => {
      if (!user?.center_id || !user?.id) throw new Error("User not authenticated");

      const messagesToInsert = recipientIds.map(recipientId => ({
        center_id: user.center_id!,
        sender_id: user.id,
        receiver_id: recipientId,
        message_text: text,
        student_id: messageType === 'individual' ? recipientId : null,
        status: 'sent' as const,
        is_read_by_receiver: false,
        is_read_by_sender: true,
      }));

      const { error } = await supabase.from("messages").insert(messagesToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["center-messages"] });
      toast.success("Message sent successfully!");
      setShowNewMessageDialog(false);
      setMessageText("");
      setSelectedRecipients([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    let recipientIds: string[] = [];

    if (messageType === 'broadcast') {
      // Get all parent user IDs or teacher user IDs based on target
      if (broadcastTarget === 'parents' || broadcastTarget === 'all') {
        recipientIds = [...recipientIds, ...students.map(s => s.id)];
      }
      if (broadcastTarget === 'teachers' || broadcastTarget === 'all') {
        recipientIds = [...recipientIds, ...teachers.map(t => t.id)];
      }
    } else {
      recipientIds = selectedRecipients;
    }

    if (recipientIds.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    sendMessageMutation.mutate({
      recipientIds,
      text: messageText,
      isBroadcast: messageType === 'broadcast',
    });
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Group messages by student/conversation
  const groupedMessages = messages.reduce((acc: any, msg: any) => {
    const key = msg.student_id || msg.receiver_id;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        name: msg.students?.name || 'Unknown',
        messages: [],
      };
    }
    acc[key].messages.push(msg);
    return acc;
  }, {});

  const conversationsList = Object.values(groupedMessages);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Message</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
              <DialogDescription>
                Send individual, group, or broadcast messages to parents and teachers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Message Type Selection */}
              <div className="space-y-2">
                <Label>Message Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={messageType === 'individual' ? 'default' : 'outline'}
                    onClick={() => { setMessageType('individual'); setSelectedRecipients([]); }}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" /> Individual
                  </Button>
                  <Button
                    type="button"
                    variant={messageType === 'group' ? 'default' : 'outline'}
                    onClick={() => { setMessageType('group'); setSelectedRecipients([]); }}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" /> Group
                  </Button>
                  <Button
                    type="button"
                    variant={messageType === 'broadcast' ? 'default' : 'outline'}
                    onClick={() => { setMessageType('broadcast'); setSelectedRecipients([]); }}
                    className="flex-1"
                  >
                    <Megaphone className="h-4 w-4 mr-2" /> Broadcast
                  </Button>
                </div>
              </div>

              {/* Recipients Selection */}
              {messageType === 'broadcast' ? (
                <div className="space-y-2">
                  <Label>Broadcast To</Label>
                  <Select value={broadcastTarget} onValueChange={(v: any) => setBroadcastTarget(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parents">All Parents ({students.length})</SelectItem>
                      <SelectItem value="teachers">All Teachers ({teachers.length})</SelectItem>
                      <SelectItem value="all">Everyone ({students.length + teachers.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Recipients</Label>
                  <ScrollArea className="h-48 border rounded-md p-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Students (Parents)</p>
                        <div className="space-y-1">
                          {students.map(student => (
                            <div key={student.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`student-${student.id}`}
                                checked={selectedRecipients.includes(student.id)}
                                onCheckedChange={() => toggleRecipient(student.id)}
                              />
                              <label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer">
                                {student.name} <span className="text-muted-foreground">({student.grade})</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Teachers</p>
                        <div className="space-y-1">
                          {teachers.map(teacher => (
                            <div key={teacher.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`teacher-${teacher.id}`}
                                checked={selectedRecipients.includes(teacher.id)}
                                onCheckedChange={() => toggleRecipient(teacher.id)}
                              />
                              <label htmlFor={`teacher-${teacher.id}`} className="text-sm cursor-pointer">
                                {teacher.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  {selectedRecipients.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedRecipients.length} recipient(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* Message Input */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : conversationsList.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No messages yet</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {conversationsList.map((conv: any) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => setSelectedConversation(conv.id)}
                    >
                      <p className="font-medium">{conv.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.messages[0]?.message_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(conv.messages[0]?.created_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation 
                ? groupedMessages[selectedConversation]?.name || 'Messages'
                : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4">
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-3">
                    {groupedMessages[selectedConversation]?.messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          msg.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message_text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(msg.created_at), "MMM d, HH:mm")}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && replyText.trim()) {
                        sendMessageMutation.mutate({
                          recipientIds: [selectedConversation],
                          text: replyText,
                          isBroadcast: false,
                        });
                        setReplyText("");
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (replyText.trim()) {
                        sendMessageMutation.mutate({
                          recipientIds: [selectedConversation],
                          text: replyText,
                          isBroadcast: false,
                        });
                        setReplyText("");
                      }
                    }}
                    disabled={!replyText.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Select a conversation to view messages or create a new message
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
