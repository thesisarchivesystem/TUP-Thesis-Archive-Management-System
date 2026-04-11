import type { User } from './user.types';

export type ThesisStatus = 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected';

export interface Thesis {
  id: string;
  title: string;
  abstract?: string;
  keywords: string[];
  department: string;
  program?: string;
  category_id?: string;
  school_year: string;
  authors: string[];
  file_url?: string;
  file_name?: string;
  file_size?: number;
  status: ThesisStatus;
  submitted_by: string;
  adviser_id?: string;
  rejection_reason?: string;
  adviser_remarks?: string;
  view_count: number;
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  created_at: string;
  submitter?: User;
  adviser?: User;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}
