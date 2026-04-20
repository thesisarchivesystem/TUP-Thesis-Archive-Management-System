<?php

namespace App\Http\Controllers;

use App\Models\SearchLog;
use App\Models\Thesis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $q = $request->input('q', '');

        if (strlen(trim($q)) < 2) {
            return response()->json(['results' => []]);
        }

        $searchDocument = "title || ' ' || COALESCE(abstract, '') || ' ' || COALESCE(keywords::text, '')";

        $results = Thesis::whereRaw(
            "to_tsvector('english', {$searchDocument}) @@ plainto_tsquery('english', ?)",
            [$q]
        )
        ->where('status', 'approved')
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

        $this->storeSearchLogs($request, $q, $results);

        return response()->json(['results' => $results]);
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
