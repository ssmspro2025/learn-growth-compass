import { useState } from 'react';
import CenterLayout from '@/components/CenterLayout';
import ConversationList from '@/components/chat/ConversationList';
import ChatInterface from '@/components/chat/ChatInterface';
import { Card } from '@/components/ui/card';

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <CenterLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-2">
            Chat with parents about their students
          </p>
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
                  Select a conversation to start chatting
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </CenterLayout>
  );
}
