"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function TeacherMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages received by teacher
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["teacher-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, username)
        `)
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ text, senderId }: { text: string; senderId: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.from("messages").insert({
        center_id: user.center_id,
        sender_id: user.id,
        receiver_id: senderId,
        message_text: text,
        status: 'sent',
        is_read_by_receiver: false,
        is_read_by_sender: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-messages"] });
      toast.success("Reply sent successfully!");
      setShowReplyDialog(false);
      setReplyText("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send reply");
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read_by_receiver: true })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-messages"] });
    },
  });

  // Group messages by sender
  const groupedMessages = messages.reduce((acc: any, msg: any) => {
    const senderId = msg.sender_id;
    if (!acc[senderId]) {
      acc[senderId] = {
        id: senderId,
        name: msg.sender?.username || 'Unknown Sender',
        messages: [],
      };
    }
    acc[senderId].messages.push(msg);
    if (!msg.is_read_by_receiver) {
      markAsReadMutation.mutate(msg.id);
    }
    return acc;
  }, {});

  const conversationsList = Object.values(groupedMessages);
  const selectedMessages = selectedConversation ? (groupedMessages[selectedConversation]?.messages || []) : [];
  const selectedSenderName = selectedConversation ? (groupedMessages[selectedConversation]?.name || '') : '';

  const handleSendReply = () => {
    if (!replyText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!selectedConversation) {
      toast.error("Please select a conversation");
      return;
    }

    sendReplyMutation.mutate({
      text: replyText,
      senderId: selectedConversation,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Inbox
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
                  {conversationsList.map((conv: any) => {
                    const unreadCount = conv.messages.filter((m: any) => !m.is_read_by_receiver).length;
                    return (
                      <div
                        key={conv.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation === conv.id 
                            ? 'bg-primary/10 border border-primary' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{conv.name}</p>
                          {unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">{unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.messages[0]?.message_text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conv.messages[0]?.created_at), "MMM d, HH:mm")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedConversation ? selectedSenderName : 'Select a conversation'}</span>
              {selectedConversation && (
                <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Reply</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reply to {selectedSenderName}</DialogTitle>
                      <DialogDescription>
                        Send a message to {selectedSenderName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your message here..."
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSendReply} 
                          disabled={sendReplyMutation.isPending || !replyText.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4">
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-3">
                    {selectedMessages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          msg.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message_text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs opacity-70">
                            {format(new Date(msg.created_at), "MMM d, HH:mm")}
                          </p>
                          {msg.sender_id !== user?.id && msg.is_read_by_receiver && (
                            <CheckCircle2 className="h-3 w-3 opacity-70" />
                          )}
                        </div>
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
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sendReplyMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Select a conversation to view messages
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
