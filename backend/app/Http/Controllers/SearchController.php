<?php

namespace App\Http\Controllers;

use App\Models\SearchLog;
use App\Models\SharedFile;
use App\Models\Thesis;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $q = $request->input('q', '');

        if (strlen(trim($q)) < 2) {
            return response()->json(['results' => []]);
        }

        $searchDocument = "title || ' ' || COALESCE(abstract, '') || ' ' || COALESCE(keywords::text, '')";

        $theses = Thesis::whereRaw(
            "to_tsvector('english', {$searchDocument}) @@ plainto_tsquery('english', ?)",
            [$q]
        )
        ->where('status', 'approved')
        ->where('is_archived', true)
        ->orderByRaw(
            "ts_rank(
               to_tsvector('english', {$searchDocument}),
               plainto_tsquery('english', ?)
             ) DESC",
            [$q]
        )
        ->limit(20)
        ->with(['submitter:id,name', 'category:id,name'])
        ->get();

        $users = $this->searchUsers($request->user(), $q);

        $this->storeSearchLogs($request, $q, $theses);

        return response()->json([
            'results' => [
                'theses' => $theses,
                'users' => $users,
            ],
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
                    'faculty' => $queryBuilder->whereIn('role', ['faculty', 'student', 'vpaa']),
                    'vpaa' => $queryBuilder->where('role', 'faculty'),
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
                ->where('is_archived', true)
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
                ->where('status', 'approved')
                ->where('is_archived', true)
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
                'vpaa' => 'VPAA',
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
}
