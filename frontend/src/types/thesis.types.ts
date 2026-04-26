import type { User } from './user.types';

export type ThesisStatus = 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected';

export interface Thesis {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  college?: string;
  department: string;
  program?: string;
  category_id?: string;
  category_ids?: string[];
  school_year: string;
  authors: string[];
  file_url?: string;
  file_name?: string;
  file_size?: number;
  status: ThesisStatus;
  is_archived?: boolean;
  submitted_by?: string | null;
  submitter_name?: string | null;
  adviser_id?: string;
  adviser_name?: string | null;
  rejection_reason?: string;
  adviser_remarks?: string;
  revision_due_at?: string;
  view_count: number;
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  archived_at?: string;
  archived_by?: string | null;
  archived_by_name?: string | null;
  created_at: string;
  submitter?: User;
  adviser?: User;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}
