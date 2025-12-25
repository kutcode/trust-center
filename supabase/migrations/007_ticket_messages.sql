-- Ticket messages table for conversation history
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'user')),
    sender_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by ticket
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created ON ticket_messages(created_at);

-- Add admin_id to contact_submissions for assignment
ALTER TABLE contact_submissions
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Add trigger for updated_at on ticket_messages (if needed)
CREATE TRIGGER update_ticket_messages_updated_at BEFORE UPDATE ON ticket_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
