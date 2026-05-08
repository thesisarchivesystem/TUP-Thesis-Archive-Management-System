import type { Thesis } from '../types/thesis.types';
import type { FavoriteRole, FavoriteThesis } from '../store/favoriteThesisStore';

type FavoriteThesisSource = Partial<Thesis> & {
  id: string;
  title: string;
  department: string;
  author?: string | null;
  year?: string | null;
  category?: string | { name?: string | null } | null;
  keywords?: string[] | null;
  categories?: Array<{ id?: string; name: string; slug?: string }> | null;
};

const deriveAuthor = (thesis: FavoriteThesisSource) => {
  const authorList = thesis.authors?.filter(Boolean);
  if (authorList?.length) return authorList.join(', ');
  if (thesis.author?.trim()) return thesis.author.trim();
  if (thesis.submitter?.name?.trim()) return thesis.submitter.name.trim();
  if (thesis.submitter_name?.trim()) return thesis.submitter_name.trim();
  return 'Unknown author';
};

const deriveCategory = (category: FavoriteThesisSource['category']) => {
  if (!category) return null;
  if (typeof category === 'string') return category;
  return category.name ?? null;
};

const deriveYear = (thesis: FavoriteThesisSource) =>
  thesis.year
  || thesis.school_year
  || thesis.approved_at?.slice(0, 4)
  || thesis.archived_at?.slice(0, 4)
  || thesis.created_at?.slice(0, 4)
  || null;

export const createFavoriteThesis = (role: FavoriteRole, thesis: FavoriteThesisSource): Omit<FavoriteThesis, 'favorited_at'> => ({
  id: thesis.id,
  role,
  title: thesis.title,
  author: deriveAuthor(thesis),
  authors: thesis.authors?.filter(Boolean) ?? [],
  submitter_name: thesis.submitter_name ?? thesis.submitter?.name ?? null,
  college: thesis.college ?? null,
  department: thesis.department,
  program: thesis.program ?? null,
  category: deriveCategory(thesis.category),
  categories: thesis.categories?.filter((item) => Boolean(item?.name)) ?? [],
  keywords: thesis.keywords?.filter(Boolean) ?? [],
  year: deriveYear(thesis),
  school_year: thesis.school_year ?? null,
  archived_at: thesis.archived_at ?? null,
  approved_at: thesis.approved_at ?? null,
  updated_at: thesis.reviewed_at ?? thesis.approved_at ?? thesis.archived_at ?? thesis.created_at ?? null,
  created_at: thesis.created_at ?? null,
  status: thesis.status ?? null,
});
