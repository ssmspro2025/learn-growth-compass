-- Enable RLS on chat tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
-- Allow center users to manage their conversations
DROP POLICY IF EXISTS "Allow center users to manage their conversations" ON public.chat_conversations;
CREATE POLICY "Allow center users to manage their conversations" ON public.chat_conversations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.center_id = chat_conversations.center_id
    AND users.role = 'center'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.center_id = chat_conversations.center_id
    AND users.role = 'center'
  )
);

-- Allow parents to view and update their conversations
DROP POLICY IF EXISTS "Allow parents to view and update their conversations" ON public.chat_conversations;
CREATE POLICY "Allow parents to view and update their conversations" ON public.chat_conversations
FOR ALL USING (
  chat_conversations.parent_user_id = auth.uid()
) WITH CHECK (
  chat_conversations.parent_user_id = auth.uid()
);

-- Policies for chat_messages
-- Allow users to view messages in their conversations
DROP POLICY IF EXISTS "Allow users to view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Allow users to view messages in their conversations" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
    AND (
      chat_conversations.parent_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.center_id = chat_conversations.center_id
        AND (users.role = 'center' OR users.role = 'teacher') -- Center and teacher users can see messages in their center's conversations
      )
    )
  )
);

-- Allow users to insert messages into their conversations
DROP POLICY IF EXISTS "Allow users to insert messages into their conversations" ON public.chat_messages;
CREATE POLICY "Allow users to insert messages into their conversations" ON public.chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
    AND (
      chat_conversations.parent_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.center_id = chat_conversations.center_id
        AND (users.role = 'center' OR users.role = 'teacher')
      )
    )
  )
  AND chat_messages.sender_user_id = auth.uid() -- Ensure sender is the authenticated user
);

-- Allow users to update their own messages (e.g., read status)
DROP POLICY IF EXISTS "Allow users to update their own messages (e.g., read status)" ON public.chat_messages;
CREATE POLICY "Allow users to update their own messages (e.g., read status)" ON public.chat_messages
FOR UPDATE USING (
  chat_messages.sender_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.center_id = chat_conversations.center_id
      AND (users.role = 'center' OR users.role = 'teacher')
    )
  )
);