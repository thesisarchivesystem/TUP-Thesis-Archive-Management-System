import type { User } from './user.types';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  student_id: string;
  faculty_id: string;
  last_message_at?: string;
  unread_count?: number;
  student?: User;
  faculty?: User;
  last_message?: Message;
}
