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
  student_id?: string | null;
  faculty_id?: string | null;
  participant_one_id?: string | null;
  participant_two_id?: string | null;
  last_message_at?: string;
  unread_count?: number;
  student?: User;
  faculty?: User;
  participant_one?: User;
  participant_two?: User;
  last_message?: Message;
}

export interface MessageContact {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  avatar_url?: string;
  conversation_id?: string | null;
}
