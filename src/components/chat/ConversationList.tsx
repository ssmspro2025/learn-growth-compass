import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  student_id: string;
  parent_user_id: string;
  updated_at: string;
  student?: {
    name: string;
  };
  parent?: {
    username: string;
  };
  unread_count?: number;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string, recipientName: string) => void;
  selectedConversationId?: string;
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    subscribeToConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      if (!user) return;

      let query = supabase
        .from('chat_conversations')
        .select(`
          *,
          student:students(name),
          parent:users!chat_conversations_parent_user_id_fkey(username)
        `)
        .order('updated_at', { ascending: false });

      // For parents, filter by their user_id
      if (user.role === 'parent') {
        query = query.eq('parent_user_id', user.id);
      }
      // For center users, filter by their center_id
      else if (user.role === 'center' || user.role === 'admin') {
        query = query.eq('center_id', user.center_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get unread counts for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_user_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('chat_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </h2>
      </div>

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => {
              const recipientName =
                user?.role === 'parent'
                  ? `${user.center_name || 'Center'} - ${conv.student?.name}`
                  : `${conv.parent?.username} (${conv.student?.name})`;

              return (
                <Button
                  key={conv.id}
                  variant="ghost"
                  className={`w-full justify-start p-4 h-auto rounded-none hover:bg-muted ${
                    selectedConversationId === conv.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => onSelectConversation(conv.id, recipientName)}
                >
                  <div className="flex flex-col items-start gap-1 w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-foreground">{recipientName}</span>
                      {conv.unread_count! > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
