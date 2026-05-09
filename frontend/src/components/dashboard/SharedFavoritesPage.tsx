import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardCollectionPageHeader from './DashboardCollectionPageHeader';
import ThesisArchiveCover from '../thesis/ThesisArchiveCover';
import { useFavoriteThesisStore, type FavoriteRole } from '../../store/favoriteThesisStore';

type SharedFavoritesPageProps = {
  role: FavoriteRole;
  title: string;
  description: string;
};

const thesisBasePathByRole: Record<FavoriteRole, string> = {
  student: '/student/theses',
  faculty: '/faculty/theses',
  admin: '/admin/theses',
};

const formatAuthorLine = (author: string, year?: string | null) => (year ? `${author} · ${year}` : author);

export default function SharedFavoritesPage({
  role,
  title,
  description,
}: SharedFavoritesPageProps) {
  const favorites = useFavoriteThesisStore((state) =>
    state.favorites
      .filter((item) => item.role === role)
      .sort((left, right) => new Date(right.favorited_at).getTime() - new Date(left.favorited_at).getTime()));

  const thesisBasePath = thesisBasePathByRole[role];

  return (
    <div className="space-y-4">
      <DashboardCollectionPageHeader
        role={role}
        title={title}
        description={description}
      />

      <div className="vpaa-card vpaa-dashboard-panel">
        <div className="vpaa-dashboard-head">
          <h3><Heart size={16} /> {title}</h3>
          <span className="vpaa-theme-count-pill">{favorites.length} THESES</span>
        </div>

        {favorites.length ? (
          <div className="recent-added-grid">
            {favorites.map((favorite) => (
              <Link
                className="recent-added-card"
                key={`${favorite.role}-${favorite.id}`}
                to={`${thesisBasePath}/${encodeURIComponent(favorite.id)}`}
                state={{ thesis: favorite }}
              >
                <ThesisArchiveCover
                  className="recent-added-card-cover"
                  compact
                  title={favorite.title}
                  college={favorite.college}
                  department={favorite.department}
                  author={formatAuthorLine(favorite.author, favorite.year)}
                  year={favorite.year}
                  categories={favorite.categories?.length
                    ? favorite.categories
                        .filter((category): category is { id?: string; name: string; slug?: string } => Boolean(category?.name))
                        .map((category, index) => ({
                          id: category.id ?? `${favorite.id}-${index}`,
                          name: category.name,
                          slug: category.slug ?? '',
                        }))
                    : [favorite.category, favorite.program || favorite.department, ...(favorite.keywords ?? [])]
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((tag, index) => ({ id: `${favorite.id}-${index}`, name: String(tag) }))}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="vpaa-dashboard-empty">No favorite theses yet.</div>
        )}
      </div>
    </div>
  );
}
