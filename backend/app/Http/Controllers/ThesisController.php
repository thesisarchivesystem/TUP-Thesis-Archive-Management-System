<?php

namespace App\Http\Controllers;

use App\Models\Thesis;
use App\Models\Category;
use App\Models\Notification;
use App\Models\RecentlyViewed;
use App\Services\AblyService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ThesisController extends Controller
{
    public function __construct(
        private AblyService $ably,
        private ActivityLogService $logger,
    ) {}

    public function index(): JsonResponse
    {
        $theses = Thesis::where('status', 'approved')
            ->with('submitter:id,name', 'category:id,name,slug')
            ->orderByDesc('approved_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function store(Request $request): JsonResponse
    {
        $keywords = $this->normalizeArrayField($request->input('keywords'));
        $authors = $this->normalizeArrayField($request->input('authors'));

        $request->merge([
            'keywords' => $keywords,
            'authors' => $authors,
        ]);

        $request->validate([
            'title'       => 'required|string|max:500',
            'abstract'    => 'nullable|string',
            'keywords'    => 'nullable|array',
            'keywords.*'  => 'string|max:100',
            'department'  => 'required|string',
            'program'     => 'nullable|string',
            'category_id' => 'required|uuid|exists:categories,id',
            'school_year' => 'required|string',
            'authors'     => 'nullable|array',
            'authors.*'   => 'string|max:255',
            'manuscript'  => 'nullable|file|mimes:pdf|max:20480',
            'supplementary_files' => 'nullable|array',
            'supplementary_files.*' => 'file|max:20480',
            'file_url'    => 'nullable|url',
            'file_name'   => 'nullable|string',
            'file_size'   => 'nullable|integer',
        ]);

        $manuscript = $request->file('manuscript');
        $manuscriptUpload = $manuscript ? $this->uploadToSupabase($manuscript, 'manuscripts') : null;

        $thesis = Thesis::create([
            'title'        => $request->title,
            'abstract'     => $request->abstract,
            'keywords'     => $keywords,
            'department'   => $request->department,
            'program'      => $request->program,
            'category_id'  => $request->category_id,
            'school_year'  => $request->school_year,
            'authors'      => $authors,
            'file_url'     => $manuscriptUpload['url'] ?? $request->file_url,
            'file_name'    => $manuscriptUpload['name'] ?? $request->file_name,
            'file_size'    => $manuscriptUpload['size'] ?? $request->file_size,
            'status'       => 'draft',
            'submitted_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $thesis], 201);
    }

    public function show(string $id): JsonResponse
    {
        $thesis = Thesis::with('submitter:id,name', 'adviser:id,name', 'category:id,name,slug')->findOrFail($id);

        // Track view if authenticated as student
        if (auth()->check() && auth()->user()->role === 'student') {
            RecentlyViewed::updateOrCreate(
                ['user_id' => auth()->id(), 'thesis_id' => $thesis->id],
                ['viewed_at' => now()]
            );
        }

        // Increment view count
        $thesis->increment('view_count');

        return response()->json(['data' => $thesis]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $thesis = Thesis::findOrFail($id);

        // Only allow updating if status is draft
        if ($thesis->status !== 'draft') {
            return response()->json(['error' => 'Cannot update submitted theses'], 403);
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:500',
            'abstract' => 'nullable|string',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:100',
            'department' => 'sometimes|required|string',
            'program' => 'nullable|string',
            'category_id' => 'sometimes|required|uuid|exists:categories,id',
            'school_year' => 'sometimes|required|string',
            'authors' => 'nullable|array',
            'authors.*' => 'string|max:255',
        ]);

        $thesis->update($request->only([
            'title', 'abstract', 'keywords', 'department', 'program', 'category_id', 'school_year', 'authors',
        ]));

        return response()->json(['data' => $thesis]);
    }

    public function submit(Request $request, string $id): JsonResponse
    {
        $thesis = Thesis::findOrFail($id);

        if ($thesis->status !== 'draft') {
            return response()->json(['error' => 'Thesis already submitted'], 403);
        }

        if (!$thesis->file_url) {
            return response()->json(['error' => 'File is required to submit'], 422);
        }

        $thesis->update([
            'status'       => 'pending',
            'submitted_at' => now(),
        ]);

        $this->logger->log($request->user(), 'thesis.submitted', 'thesis', $thesis->id);

        return response()->json(['data' => $thesis]);
    }

    public function review(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status'           => 'required|in:approved,rejected',
            'adviser_remarks'  => 'nullable|string|max:2000',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:2000',
        ]);

        $thesis = Thesis::findOrFail($id);

        $thesis->update([
            'status'           => $request->status,
            'adviser_remarks'  => $request->adviser_remarks,
            'rejection_reason' => $request->rejection_reason,
            'reviewed_at'      => now(),
            'approved_at'      => $request->status === 'approved' ? now() : null,
        ]);

        // ── Notify student via Ably ──────────────────────────────
        $eventName = $request->status === 'approved' ? 'thesis.approved' : 'thesis.rejected';
        $this->ably->publishNotification($thesis->submitted_by, $eventName, [
            'thesis_id'    => $thesis->id,
            'thesis_title' => $thesis->title,
            'status'       => $request->status,
            'remarks'      => $request->adviser_remarks,
            'reason'       => $request->rejection_reason,
        ]);

        // ── Save DB notification ─────────────────────────────────
        Notification::create([
            'user_id' => $thesis->submitted_by,
            'type'    => $eventName,
            'title'   => $request->status === 'approved'
                         ? 'Thesis Approved 🎉'
                         : 'Thesis Needs Revision',
            'body'    => $request->adviser_remarks ?? $request->rejection_reason,
            'data'    => ['thesis_id' => $thesis->id],
        ]);

        // ── Log activity ─────────────────────────────────────────
        $this->logger->log($request->user(), $eventName, 'thesis', $thesis->id);

        return response()->json(['data' => $thesis]);
    }

    public function pendingReview(Request $request): JsonResponse
    {
        $theses = Thesis::whereIn('status', ['pending', 'under_review'])
            ->where('adviser_id', $request->user()->id)
            ->with('submitter:id,name')
            ->orderByDesc('submitted_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function approved(Request $request): JsonResponse
    {
        $theses = Thesis::where('status', 'approved')
            ->with('submitter:id,name', 'category:id,name,slug')
            ->orderByDesc('approved_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function mySubmissions(Request $request): JsonResponse
    {
        $theses = Thesis::where('submitted_by', $request->user()->id)
            ->with('category:id,name,slug')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($theses);
    }

    public function recentlyViewed(Request $request): JsonResponse
    {
        $theses = RecentlyViewed::where('user_id', $request->user()->id)
            ->orderByDesc('viewed_at')
            ->with('thesis.submitter:id,name', 'thesis.category:id,name,slug')
            ->paginate(20);

        return response()->json($theses);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->withCount(['theses as document_count' => function ($query) {
                $query->where('status', 'approved');
            }])
            ->withMax(['theses as latest_approved_at' => function ($query) {
                $query->where('status', 'approved');
            }], 'approved_at')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $data = $categories->map(function (Category $category) {
            $theses = Thesis::query()
                ->where('category_id', $category->id)
                ->where('status', 'approved')
                ->select([
                    'id',
                    'title',
                    'authors',
                    'department',
                    'program',
                    'school_year',
                    'keywords',
                    'approved_at',
                    'created_at',
                    'submitted_by',
                ])
                ->with('submitter:id,name')
                ->orderByDesc('approved_at')
                ->limit(6)
                ->get();

            return [
                'id' => $category->id,
                'slug' => $category->slug,
                'label' => $category->name,
                'description' => $category->description,
                'document_count' => (int) $category->document_count,
                'updated_at' => $this->formatIsoTimestamp($category->latest_approved_at),
                'theses' => $theses->map(function (Thesis $thesis) {
                    return [
                        'id' => $thesis->id,
                        'title' => $thesis->title,
                        'author' => collect($thesis->authors ?? [])->filter()->implode(', ') ?: ($thesis->submitter?->name ?? 'Unknown author'),
                        'year' => $thesis->approved_at?->format('Y') ?? ($thesis->created_at?->format('Y') ?? null),
                        'department' => $thesis->department,
                        'program' => $thesis->program,
                        'school_year' => $thesis->school_year,
                        'keywords' => collect($thesis->keywords ?? [])->filter()->take(2)->values()->all(),
                        'approved_at' => optional($thesis->approved_at)?->toISOString(),
                    ];
                })->all(),
            ];
        })->values();

        return response()->json([
            'data' => [
                'categories' => $data,
            ],
        ]);
    }

    private function formatIsoTimestamp(mixed $value): ?string
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        try {
            return Carbon::parse($value)->toISOString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function normalizeArrayField(mixed $value): array
    {
        if (is_array($value)) {
            return collect($value)->map(fn ($item) => is_string($item) ? trim($item) : $item)->filter()->values()->all();
        }

        if (!is_string($value) || trim($value) === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return collect($decoded)->map(fn ($item) => is_string($item) ? trim($item) : $item)->filter()->values()->all();
        }

        return collect(explode(',', $value))->map(fn (string $item) => trim($item))->filter()->values()->all();
    }

    private function uploadToSupabase(\Illuminate\Http\UploadedFile $file, string $folder): array
    {
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $serviceKey = (string) config('services.supabase.service_key');
        $bucket = (string) config('services.supabase.bucket');

        if ($supabaseUrl === '' || $serviceKey === '' || $bucket === '') {
            throw new \RuntimeException('Supabase storage is not configured.');
        }

        $path = sprintf(
            'student-theses/%s/%s/%s-%s',
            $folder,
            now()->format('Y/m'),
            (string) Str::uuid(),
            preg_replace('/[^A-Za-z0-9.\-_]/', '-', $file->getClientOriginalName())
        );

        $response = Http::withHeaders([
            'apikey' => $serviceKey,
            'Authorization' => 'Bearer ' . $serviceKey,
            'x-upsert' => 'true',
            'Content-Type' => $file->getMimeType() ?: 'application/octet-stream',
        ])->withBody(file_get_contents($file->getRealPath()), $file->getMimeType() ?: 'application/octet-stream')
            ->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if ($response->failed()) {
            throw new \RuntimeException('Failed to upload file to storage.');
        }

        return [
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'path' => $path,
            'url' => "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}",
        ];
    }
}
