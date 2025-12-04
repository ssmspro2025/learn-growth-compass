"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageSquare, Users } from "lucide-react";
import { format } from "date-fns";

export default function ParentMessaging() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!user || user.role !== 'parent' || !user.id) {
    return <div className="p-6 text-center text-muted-foreground">Please log in as a parent to view messages.</div>;
  }

  // Fetch ALL conversations for the parent
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["parent-conversations", user.id],
    queryFn: async () => {
      if (!user.id) return [];
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(`
          *,
          students:student_id(id, name, grade),
          centers:center_id(id, name)
        `)
        .eq("parent_user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user.id,
  });

  // Fetch messages for the selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["parent-chat-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:sender_user_id(id, username, role)
        `)
        .eq("conversation_id", selectedConversation.id)
        .order("sent_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when a conversation is selected or messages load
  useEffect(() => {
    const markAsRead = async () => {
      if (!selectedConversation?.id || !user?.id) return;
      const unreadMessages = messages.filter(
        (m: any) => !m.is_read && m.sender_user_id !== user.id
      );
      if (unreadMessages.length > 0) {
        await supabase
          .from("chat_messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", unreadMessages.map((m: any) => m.id));
        // Invalidate queries to update unread counts in sidebar/conversation list
        queryClient.invalidateQueries({ queryKey: ["parent-chat-conversations", user.id] });
        queryClient.invalidateQueries({ queryKey: ["unread-messages-parent", user.id] });
      }
    };
    markAsRead();
  }, [messages, selectedConversation?.id, user?.id, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation?.id || !user?.id || !newMessage.trim()) {
        throw new Error("Missing required data");
      }
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: selectedConversation.id,
        sender_user_id: user.id,
        message_text: newMessage.trim(),
      });
      if (error) throw error;

      // Update conversation updated_at to bring it to the top of the list
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["parent-chat-messages", selectedConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["parent-conversations", user.id] }); // Invalidate conversation list
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate();
    }
  };

  if (conversationsLoading) {
    return <div className="p-6 text-center">Loading conversations...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <p className="text-center text-muted-foreground p-4">No conversations yet. The center will initiate one with you.</p>
              ) : (
                conversations.map((conv: any) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium">
                      {conv.centers?.name || "Center"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Regarding: {conv.students?.name} (Grade {conv.students?.grade})
                    </p>
                    {/* You might want to display the last message or unread count here */}
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedConversation
                ? `Chat with ${selectedConversation.centers?.name || "Center"}`
                : "Select a conversation"}
            </CardTitle>
            {selectedConversation && (
              <p className="text-sm text-muted-foreground">
                Regarding: {selectedConversation.students?.name} (Grade {selectedConversation.students?.grade})
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[520px]">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation from the left to start messaging
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <p className="text-center text-muted-foreground">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg: any) => {
                        const isOwnMessage = msg.sender_user_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{msg.message_text}</p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {format(new Date(msg.sent_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}