<?php

namespace App\Http\Controllers;

use App\Models\SearchLog;
use App\Models\Category;
use App\Models\SharedFile;
use App\Models\Thesis;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class SearchController extends Controller
{
    private const SUGGESTION_FIELDS = ['year', 'category', 'program'];

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q', ''));
        $normalizedQuery = mb_strtolower($q);
        $queryLike = '%' . $normalizedQuery . '%';
        $hasKeywordsColumn = Schema::hasColumn('theses', 'keywords');
        $hasSubmitterNameColumn = Schema::hasColumn('theses', 'submitter_name');
        $hasAdviserNameColumn = Schema::hasColumn('theses', 'adviser_name');
        $filters = [
            'year' => trim((string) $request->input('year', '')),
            'category' => trim((string) $request->input('category', '')),
            'program' => trim((string) $request->input('program', '')),
            'department' => trim((string) $request->input('department', '')),
        ];
        $hasKeyword = mb_strlen($q) >= 2;
        $isYearKeyword = preg_match('/^\d{4}$/', $q) === 1;
        $hasFilters = collect($filters)->contains(fn (string $value) => $value !== '');

        if (!$hasKeyword && !$hasFilters) {
            return response()->json([
                'results' => [
                    'theses' => [],
                    'users' => [],
                ],
            ]);
        }

        $searchDocumentParts = [
            "COALESCE(theses.title, '')",
            "COALESCE(theses.abstract, '')",
            "COALESCE(theses.department, '')",
            "COALESCE(theses.program, '')",
            "COALESCE(theses.school_year, '')",
            "COALESCE(CAST(theses.authors AS TEXT), '')",
            "COALESCE(search_categories.name, '')",
            "COALESCE(search_categories.slug, '')",
            "COALESCE(submitter_users.name, '')",
            "COALESCE(adviser_users.name, '')",
            "COALESCE(EXTRACT(YEAR FROM theses.approved_at)::text, '')",
            "COALESCE(EXTRACT(YEAR FROM theses.created_at)::text, '')",
        ];

        if ($hasSubmitterNameColumn) {
            $searchDocumentParts[] = "COALESCE(theses.submitter_name, '')";
        }

        if ($hasAdviserNameColumn) {
            $searchDocumentParts[] = "COALESCE(theses.adviser_name, '')";
        }

        if ($hasKeywordsColumn) {
            $searchDocumentParts[] = "COALESCE(CAST(theses.keywords AS TEXT), '')";
        }

        $searchDocument = implode(" || ' ' || ", $searchDocumentParts);

        $matchingCategoryIds = $hasKeyword
            ? Category::query()
                ->where(function ($categoryQuery) use ($queryLike) {
                    $categoryQuery
                        ->whereRaw('LOWER(name) LIKE ?', [$queryLike])
                        ->orWhereRaw('LOWER(COALESCE(slug, \'\')) LIKE ?', [$queryLike]);
                })
                ->pluck('id')
                ->values()
            : collect();

        $thesisQuery = Thesis::query()
            ->select('theses.*')
            ->leftJoin('categories as search_categories', 'search_categories.id', '=', 'theses.category_id')
            ->leftJoin('users as submitter_users', 'submitter_users.id', '=', 'theses.submitted_by')
            ->leftJoin('users as adviser_users', 'adviser_users.id', '=', 'theses.adviser_id')
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true');

        if ($hasKeyword) {
            $thesisQuery
                ->where(function ($queryBuilder) use ($searchDocument, $q, $queryLike, $matchingCategoryIds, $isYearKeyword) {
                    $queryBuilder
                        ->whereRaw(
                            "to_tsvector('english', {$searchDocument}) @@ plainto_tsquery('english', ?)",
                            [$q]
                        )
                        ->orWhereRaw("LOWER({$searchDocument}) LIKE ?", [$queryLike]);

                    if ($isYearKeyword) {
                        $queryBuilder->orWhere(function ($yearQuery) use ($q, $queryLike) {
                            $yearQuery
                                ->whereYear('theses.approved_at', $q)
                                ->orWhereYear('theses.created_at', $q)
                                ->orWhereRaw('LOWER(COALESCE(theses.school_year, \'\')) LIKE ?', [$queryLike]);
                        });
                    }

                    if ($matchingCategoryIds->isNotEmpty()) {
                        $queryBuilder->orWhere(function ($categoryQuery) use ($matchingCategoryIds) {
                            $categoryQuery->whereIn('theses.category_id', $matchingCategoryIds);

                            foreach ($matchingCategoryIds as $categoryId) {
                                $categoryQuery->orWhereJsonContains('theses.category_ids', $categoryId);
                            }
                        });
                    }
                })
                ->orderByRaw(
                    "ts_rank(
                       to_tsvector('english', {$searchDocument}),
                       plainto_tsquery('english', ?)
                     ) DESC,
                     CASE
                       WHEN LOWER(COALESCE(theses.title, '')) LIKE ? THEN 3
                       WHEN LOWER(COALESCE(CAST(theses.authors AS TEXT), '')) LIKE ? THEN 2
                       WHEN LOWER(COALESCE(" . ($hasSubmitterNameColumn ? "theses.submitter_name, " : "") . "submitter_users.name, '')) LIKE ? THEN 2
                       WHEN LOWER(COALESCE(theses.department, '')) LIKE ? THEN 1
                       WHEN LOWER(COALESCE(theses.program, '')) LIKE ? THEN 1
                       WHEN LOWER(COALESCE(theses.school_year, '')) LIKE ? THEN 1
                       ELSE 0
                     END DESC",
                    [$q, $queryLike, $queryLike, $queryLike, $queryLike, $queryLike, $queryLike]
                );
        } else {
            $thesisQuery
                ->orderByDesc('approved_at')
                ->orderByDesc('created_at');
        }

        $this->applyThesisFilters($thesisQuery, $filters);

        $theses = $thesisQuery
            ->limit(20)
            ->with(['submitter:id,name', 'category:id,name,slug'])
            ->get();

        $users = $hasKeyword && !$hasFilters ? $this->searchUsers($request->user(), $q) : collect();

        $this->storeSearchLogs($request, $this->formatSearchLogQuery($q, $filters), $theses);

        return response()->json([
            'results' => [
                'theses' => $theses->map(fn (Thesis $thesis) => $this->transformSearchThesis($thesis))->values(),
                'users' => $users,
            ],
        ]);
    }

    public function filterOptions(): JsonResponse
    {
        return response()->json([
            'years' => $this->suggestYears(''),
            'categories' => $this->suggestCategories(''),
            'programs' => $this->suggestPrograms(''),
            'departments' => $this->suggestDepartments(''),
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $field = trim((string) $request->input('field', ''));
        $query = mb_strtolower(trim((string) $request->input('q', '')));

        if (!in_array($field, self::SUGGESTION_FIELDS, true)) {
            return response()->json(['suggestions' => []]);
        }

        $suggestions = match ($field) {
            'year' => $this->suggestYears($query),
            'category' => $this->suggestCategories($query),
            'program' => $this->suggestPrograms($query),
        };

        return response()->json(['suggestions' => $suggestions]);
    }

    public function click(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'thesis_id' => 'required|uuid|exists:theses,id',
            'query' => 'required|string|min:2|max:255',
        ]);

        SearchLog::query()->create([
            'user_id' => $request->user()?->id,
            'thesis_id' => $validated['thesis_id'],
            'query' => trim($validated['query']),
            'results_count' => 1,
            'clicked_at' => now(),
        ]);

        return response()->json([
            'message' => 'Search click logged successfully.',
        ]);
    }

    private function searchUsers(?User $actor, string $query): Collection
    {
        $normalizedQuery = '%' . mb_strtolower(trim($query)) . '%';

        $users = User::query()
            ->with(['faculty:user_id,department,college,faculty_role,rank', 'student:user_id,department,program,year_level'])
            ->where(function ($queryBuilder) use ($normalizedQuery) {
                $queryBuilder->whereRaw("LOWER(name) LIKE ?", [$normalizedQuery])
                    ->orWhereRaw("LOWER(email) LIKE ?", [$normalizedQuery]);
            })
            ->whereRaw('is_active = true')
            ->when($actor, function ($queryBuilder) use ($actor) {
                $queryBuilder->where('id', '!=', $actor->id);

                match ($actor->role) {
                    'student' => $queryBuilder->whereIn('role', ['student', 'faculty']),
                    'faculty' => $queryBuilder->whereIn('role', ['faculty', 'student']),
                    default => $queryBuilder->whereRaw('1 = 0'),
                };
            })
            ->limit(12)
            ->get();

        $userIds = $users->pluck('id')->filter()->values();

        $thesisContributions = $userIds->isEmpty()
            ? collect()
            : Thesis::query()
                ->selectRaw('submitted_by as user_id, COUNT(*) as total')
                ->whereIn('submitted_by', $userIds)
                ->groupBy('submitted_by')
                ->pluck('total', 'user_id');

        $approvedContributions = $userIds->isEmpty()
            ? collect()
            : Thesis::query()
                ->selectRaw('submitted_by as user_id, COUNT(*) as total')
                ->whereIn('submitted_by', $userIds)
                ->where('status', 'approved')
                ->groupBy('submitted_by')
                ->pluck('total', 'user_id');

        $sharedFileContributions = $userIds->isEmpty()
            ? collect()
            : SharedFile::query()
                ->selectRaw('uploaded_by as user_id, COUNT(*) as total')
                ->whereIn('uploaded_by', $userIds)
                ->groupBy('uploaded_by')
                ->pluck('total', 'user_id');

        $recentTheses = $userIds->isEmpty()
            ? collect()
            : Thesis::query()
                ->select(['id', 'title', 'submitted_by', 'approved_at', 'created_at', 'status'])
                ->whereIn('submitted_by', $userIds)
                ->orderByDesc('approved_at')
                ->orderByDesc('created_at')
                ->get()
                ->groupBy('submitted_by')
                ->map(fn (Collection $items) => $items->take(3)->values());

        $recentSharedFiles = $userIds->isEmpty()
            ? collect()
            : SharedFile::query()
                ->select(['id', 'title', 'uploaded_by', 'shared_at', 'created_at', 'is_draft'])
                ->whereIn('uploaded_by', $userIds)
                ->orderByDesc('shared_at')
                ->orderByDesc('created_at')
                ->get()
                ->groupBy('uploaded_by')
                ->map(fn (Collection $items) => $items->take(3)->values());

        return $users->map(function (User $user) use ($thesisContributions, $approvedContributions, $sharedFileContributions, $recentTheses, $recentSharedFiles) {
            $roleLabel = match ($user->role) {
                'faculty' => $user->faculty?->faculty_role ?: 'Faculty',
                'student' => 'Student',
                default => ucfirst($user->role),
            };

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_label' => $roleLabel,
                'department' => $user->faculty?->department ?? $user->student?->department,
                'college' => $user->faculty?->college,
                'program' => $user->student?->program,
                'contributions' => [
                    'theses' => (int) ($thesisContributions[$user->id] ?? 0),
                    'approved_theses' => (int) ($approvedContributions[$user->id] ?? 0),
                    'shared_files' => (int) ($sharedFileContributions[$user->id] ?? 0),
                ],
                'recent_contributions' => [
                    'theses' => collect($recentTheses->get($user->id, collect()))
                        ->map(fn (Thesis $thesis) => [
                            'id' => $thesis->id,
                            'title' => $thesis->title,
                            'type' => 'Thesis',
                            'status' => $thesis->status,
                            'created_at' => optional($thesis->approved_at ?? $thesis->created_at)?->toISOString(),
                        ])->values()->all(),
                    'shared_files' => collect($recentSharedFiles->get($user->id, collect()))
                        ->map(fn (SharedFile $file) => [
                            'id' => $file->id,
                            'title' => $file->title,
                            'type' => 'Shared File',
                            'status' => $file->is_draft ? 'draft' : 'shared',
                            'created_at' => optional($file->shared_at ?? $file->created_at)?->toISOString(),
                        ])->values()->all(),
                ],
            ];
        })->values();
    }

    private function suggestYears(string $query): array
    {
        $schoolYears = Thesis::query()
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->whereNotNull('school_year')
            ->when($query !== '', fn ($thesisQuery) => $thesisQuery->whereRaw('LOWER(school_year) LIKE ?', ["%{$query}%"]))
            ->distinct()
            ->orderByDesc('school_year')
            ->limit(12)
            ->pluck('school_year');

        $calendarYears = Thesis::query()
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->selectRaw("COALESCE(EXTRACT(YEAR FROM approved_at), EXTRACT(YEAR FROM created_at))::text as year")
            ->whereRaw('COALESCE(approved_at, created_at) IS NOT NULL')
            ->when($query !== '', fn ($thesisQuery) => $thesisQuery->whereRaw("COALESCE(EXTRACT(YEAR FROM approved_at), EXTRACT(YEAR FROM created_at))::text LIKE ?", ["%{$query}%"]))
            ->distinct()
            ->orderByDesc('year')
            ->limit(12)
            ->pluck('year');

        return $schoolYears
            ->merge($calendarYears)
            ->map(fn ($year) => trim((string) $year))
            ->filter()
            ->unique()
            ->take(12)
            ->values()
            ->all();
    }

    private function suggestCategories(string $query): array
    {
        return Category::query()
            ->when($query !== '', function ($categoryQuery) use ($query) {
                $categoryQuery
                    ->whereRaw('LOWER(name) LIKE ?', ["%{$query}%"])
                    ->orWhereRaw('LOWER(COALESCE(slug, \'\')) LIKE ?', ["%{$query}%"]);
            })
            ->orderBy('name')
            ->limit(12)
            ->pluck('name')
            ->map(fn ($category) => trim((string) $category))
            ->filter()
            ->values()
            ->all();
    }

    private function suggestPrograms(string $query): array
    {
        return Thesis::query()
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->whereNotNull('program')
            ->when($query !== '', fn ($thesisQuery) => $thesisQuery->whereRaw('LOWER(program) LIKE ?', ["%{$query}%"]))
            ->distinct()
            ->orderBy('program')
            ->limit(12)
            ->pluck('program')
            ->map(fn ($program) => trim((string) $program))
            ->filter()
            ->values()
            ->all();
    }

    private function suggestDepartments(string $query): array
    {
        return Thesis::query()
            ->where('status', 'approved')
            ->whereRaw('"is_archived" = true')
            ->whereNotNull('department')
            ->when($query !== '', fn ($thesisQuery) => $thesisQuery->whereRaw('LOWER(department) LIKE ?', ["%{$query}%"]))
            ->distinct()
            ->orderBy('department')
            ->limit(20)
            ->pluck('department')
            ->map(fn ($department) => trim((string) $department))
            ->filter()
            ->values()
            ->all();
    }

    private function applyThesisFilters($queryBuilder, array $filters): void
    {
        if ($filters['year'] !== '') {
            $year = $filters['year'];
            $yearLike = '%' . mb_strtolower($year) . '%';

            $queryBuilder->where(function ($yearQuery) use ($year, $yearLike) {
                if (preg_match('/^\d{4}$/', $year)) {
                    $yearQuery
                        ->whereYear('theses.approved_at', $year)
                        ->orWhereYear('theses.created_at', $year);
                }

                $yearQuery->orWhereRaw('LOWER(COALESCE(theses.school_year, \'\')) LIKE ?', [$yearLike]);
            });
        }

        if ($filters['program'] !== '') {
            $programLike = '%' . mb_strtolower($filters['program']) . '%';

            $queryBuilder->whereRaw('LOWER(COALESCE(theses.program, \'\')) LIKE ?', [$programLike]);
        }

        if ($filters['department'] !== '') {
            $departmentLike = '%' . mb_strtolower($filters['department']) . '%';

            $queryBuilder->whereRaw('LOWER(COALESCE(theses.department, \'\')) LIKE ?', [$departmentLike]);
        }

        if ($filters['category'] !== '') {
            $categoryLike = '%' . mb_strtolower($filters['category']) . '%';
            $categoryIds = Category::query()
                ->where(function ($categoryQuery) use ($categoryLike) {
                    $categoryQuery
                        ->whereRaw('LOWER(name) LIKE ?', [$categoryLike])
                        ->orWhereRaw('LOWER(COALESCE(slug, \'\')) LIKE ?', [$categoryLike]);
                })
                ->pluck('id')
                ->values();

            if ($categoryIds->isEmpty()) {
                $queryBuilder->whereRaw('1 = 0');

                return;
            }

            $queryBuilder->where(function ($categoryQuery) use ($categoryIds) {
                $categoryQuery->whereIn('theses.category_id', $categoryIds);

                foreach ($categoryIds as $categoryId) {
                    $categoryQuery->orWhereJsonContains('category_ids', $categoryId);
                }
            });
        }
    }

    private function formatSearchLogQuery(string $query, array $filters): string
    {
        $parts = [];

        if (mb_strlen($query) >= 2) {
            $parts[] = $query;
        }

        foreach (['year' => 'Year', 'category' => 'Category', 'program' => 'Program', 'department' => 'Department'] as $key => $label) {
            if (($filters[$key] ?? '') !== '') {
                $parts[] = "{$label}: {$filters[$key]}";
            }
        }

        return implode(' | ', $parts);
    }

    private function storeSearchLogs(Request $request, string $query, $results): void
    {
        $timestamp = now();
        $resultCount = $results->count();

        if ($resultCount === 0) {
            SearchLog::query()->create([
                'user_id' => $request->user()?->id,
                'query' => trim($query),
                'results_count' => 0,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            return;
        }

        SearchLog::query()->insert(
            $results->values()->map(function (Thesis $thesis, int $index) use ($request, $query, $resultCount, $timestamp) {
                return [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'user_id' => $request->user()?->id,
                    'thesis_id' => $thesis->id,
                    'query' => trim($query),
                    'result_rank' => $index + 1,
                    'results_count' => $resultCount,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            })->all()
        );
    }

    private function transformSearchThesis(Thesis $thesis): array
    {
        $categories = $this->resolveCategorySummaries($thesis);

        return [
            'id' => $thesis->id,
            'title' => $thesis->title,
            'college' => $this->resolveCollegeForDepartment($thesis->department),
            'department' => $thesis->department,
            'program' => $thesis->program,
            'authors' => collect($thesis->authors ?? [])->filter()->values()->all(),
            'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
            'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
            'keywords' => collect($thesis->keywords ?? [])->filter()->values()->all(),
            'created_at' => optional($thesis->created_at)?->toISOString(),
            'submitter' => $thesis->submitter ? [
                'id' => $thesis->submitter->id,
                'name' => $thesis->submitter->name,
            ] : null,
            'category' => $categories[0] ?? ($thesis->category ? [
                'id' => $thesis->category->id,
                'name' => $thesis->category->name,
                'slug' => $thesis->category->slug,
            ] : null),
            'categories' => $categories,
        ];
    }

    private function resolveCollegeForDepartment(?string $department): ?string
    {
        $normalizedDepartment = trim((string) $department);

        if ($normalizedDepartment === '') {
            return null;
        }

        $departmentCollegeMap = config('academic.department_college_map', []);

        return isset($departmentCollegeMap[$normalizedDepartment])
            ? trim((string) $departmentCollegeMap[$normalizedDepartment])
            : null;
    }

    private function resolveCategorySummaries(Thesis $thesis): array
    {
        $categoryIds = collect($thesis->category_ids ?? [])
            ->filter(fn ($id) => is_string($id) && trim($id) !== '')
            ->values();

        if ($categoryIds->isEmpty() && $thesis->category_id) {
            $categoryIds = collect([$thesis->category_id]);
        }

        if ($categoryIds->isEmpty()) {
            return [];
        }

        $categories = Category::query()
            ->whereIn('id', $categoryIds)
            ->get(['id', 'name', 'slug'])
            ->keyBy('id');

        return $categoryIds
            ->map(fn (string $id) => $categories->get($id))
            ->filter()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ])
            ->values()
            ->all();
    }
}
