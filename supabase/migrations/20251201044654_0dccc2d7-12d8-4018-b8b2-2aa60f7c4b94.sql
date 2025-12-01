-- Create chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(center_id, parent_user_id, student_id)
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
-- Parents can view their own conversations
CREATE POLICY "Parents can view their conversations"
  ON public.chat_conversations
  FOR SELECT
  USING (parent_user_id = auth.uid());

-- Center users can view conversations for their center
CREATE POLICY "Center users can view their center conversations"
  ON public.chat_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.center_id = chat_conversations.center_id
        AND users.role IN ('center', 'admin')
    )
  );

-- Parents can insert conversations for their students
CREATE POLICY "Parents can create conversations"
  ON public.chat_conversations
  FOR INSERT
  WITH CHECK (
    parent_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_id
    )
  );

-- Center users can insert conversations
CREATE POLICY "Center users can create conversations"
  ON public.chat_conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.center_id = chat_conversations.center_id
        AND users.role IN ('center', 'admin')
    )
  );

-- RLS Policies for chat_messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
          chat_conversations.parent_user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.center_id = chat_conversations.center_id
              AND users.role IN ('center', 'admin')
          )
        )
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
          chat_conversations.parent_user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.center_id = chat_conversations.center_id
              AND users.role IN ('center', 'admin')
          )
        )
    )
  );

-- Users can update messages (for marking as read)
CREATE POLICY "Users can update messages in their conversations"
  ON public.chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
          chat_conversations.parent_user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
              AND users.center_id = chat_conversations.center_id
              AND users.role IN ('center', 'admin')
          )
        )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_chat_conversations_parent ON public.chat_conversations(parent_user_id);
CREATE INDEX idx_chat_conversations_center ON public.chat_conversations(center_id);
CREATE INDEX idx_chat_conversations_student ON public.chat_conversations(student_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_user_id);
CREATE INDEX idx_chat_messages_sent_at ON public.chat_messages(sent_at DESC);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Trigger to update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();