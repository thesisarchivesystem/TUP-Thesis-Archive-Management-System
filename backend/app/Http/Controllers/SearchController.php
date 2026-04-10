<?php

namespace App\Http\Controllers;

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

        $results = Thesis::whereRaw(
            "to_tsvector('english', title || ' ' || COALESCE(abstract,'') || ' ' || COALESCE(array_to_string(keywords,' '),''))
             @@ plainto_tsquery('english', ?)",
            [$q]
        )
        ->where('status', 'approved')
        ->orderByRaw(
            "ts_rank(
               to_tsvector('english', title || ' ' || COALESCE(abstract,'')),
               plainto_tsquery('english', ?)
             ) DESC",
            [$q]
        )
        ->limit(20)
        ->with('submitter:id,name')
        ->get();

        return response()->json(['results' => $results]);
    }
}
