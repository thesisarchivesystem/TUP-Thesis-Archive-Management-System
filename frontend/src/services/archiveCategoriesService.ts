import api from './api';
import type { UserRole } from '../types/user.types';

type ArchiveRole = Exclude<UserRole, 'admin'>;

export type ArchiveCategory = {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  document_count: number;
  updated_at?: string | null;
  theses: Array<{
    id: string;
    title: string;
    author: string;
    authors: string[];
    abstract?: string | null;
    year?: string | null;
    college?: string | null;
    department: string;
    program?: string | null;
    school_year?: string | null;
    categories: Array<{ id: string; name: string; slug?: string }>;
    keywords: string[];
    approved_at?: string | null;
    resource_type?: string | null;
    type?: string | null;
    share_scope?: string | null;
  }>;
};

type ListOptions = {
  slug?: string;
  thesisLimit?: number;
  includeTheses?: boolean;
  allTheses?: boolean;
};

export const archiveCategoriesService = {
  async list(_role: ArchiveRole | null | undefined, options: ListOptions = {}): Promise<ArchiveCategory[]> {
    const { data } = await api.get('/categories', {
      params: {
        slug: options.slug,
        thesis_limit: options.thesisLimit,
        include_theses: options.includeTheses,
        all_theses: options.allTheses,
      },
    });

    return data?.data?.categories ?? [];
  },
};
