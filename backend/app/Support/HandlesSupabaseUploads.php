<?php

namespace App\Support;

use GuzzleHttp\Psr7\Utils;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

trait HandlesSupabaseUploads
{
    private function uploadFileToSupabase(UploadedFile $file, string $folder, string $rootFolder): array
    {
        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $serviceKey = (string) config('services.supabase.service_key');
        $bucket = (string) config('services.supabase.bucket');

        if ($supabaseUrl === '' || $serviceKey === '' || $bucket === '') {
            throw new \RuntimeException('Supabase storage is not configured.');
        }

        $path = sprintf(
            '%s/%s/%s/%s-%s',
            trim($rootFolder, '/'),
            $folder,
            now()->format('Y/m'),
            (string) Str::uuid(),
            preg_replace('/[^A-Za-z0-9.\-_]/', '-', $file->getClientOriginalName())
        );

        $sourcePath = $file->getRealPath();
        $originalMime = $file->getMimeType() ?: 'application/octet-stream';
        $uploadPath = $sourcePath;
        $uploadMime = $originalMime;
        $uploadSize = (int) ($file->getSize() ?: ($sourcePath && is_file($sourcePath) ? filesize($sourcePath) : 0));
        $originalSize = $uploadSize;
        $compressedPath = null;
        $body = null;

        try {
            $compressionEnabled = filter_var(config('services.pdf_compression.enabled', true), FILTER_VALIDATE_BOOLEAN);
            $isPdf = $originalMime === 'application/pdf'
                || $file->getClientMimeType() === 'application/pdf'
                || strtolower($file->getClientOriginalExtension()) === 'pdf';

            if ($compressionEnabled && $isPdf && $sourcePath && is_file($sourcePath)) {
                $preset = strtolower((string) config('services.pdf_compression.preset', 'ebook'));
                $preset = in_array($preset, ['screen', 'ebook', 'printer'], true) ? $preset : 'ebook';
                $forceDownsample = filter_var(config('services.pdf_compression.force_downsample', false), FILTER_VALIDATE_BOOLEAN);
                $imageDpi = max(36, min((int) config('services.pdf_compression.image_dpi', 72), 300));
                $timeoutSeconds = max(1, min((int) config('services.pdf_compression.timeout', 20), 60));

                Log::info('PDF compression starting.', [
                    'storage_root' => trim($rootFolder, '/'),
                    'preset' => $preset,
                    'force_downsample' => $forceDownsample,
                    'image_dpi' => $forceDownsample ? $imageDpi : null,
                    'timeout_seconds' => $timeoutSeconds,
                    'original_size' => $originalSize,
                ]);

                if (!function_exists('proc_open')) {
                    Log::warning('PDF compression skipped because proc_open is disabled.');
                } else {
                    $compressedPath = tempnam(sys_get_temp_dir(), 'tams_pdf_') ?: null;
                    $configuredBinary = trim((string) config('services.pdf_compression.gs_binary', ''));
                    $defaultBinaries = PHP_OS_FAMILY === 'Windows' ? ['gswin64c', 'gswin32c', 'gs'] : ['gs'];
                    $binaries = $configuredBinary !== ''
                        ? array_values(array_unique([$configuredBinary, ...$defaultBinaries]))
                        : $defaultBinaries;
                    $lastCompressionError = 'Ghostscript did not produce a smaller PDF.';

                    foreach ($binaries as $binary) {
                        if (!$compressedPath) {
                            break;
                        }

                        // The array form avoids shell interpolation and keeps paths with spaces safe.
                        $command = [
                            $binary,
                            '-sDEVICE=pdfwrite',
                            '-dCompatibilityLevel=1.4',
                            "-dPDFSETTINGS=/{$preset}",
                            '-dNOPAUSE',
                            '-dBATCH',
                            '-dQUIET',
                            "-sOutputFile={$compressedPath}",
                            $sourcePath,
                        ];

                        if ($forceDownsample) {
                            array_splice($command, -2, 0, [
                                "-dColorImageResolution={$imageDpi}",
                                "-dGrayImageResolution={$imageDpi}",
                                "-dMonoImageResolution={$imageDpi}",
                                '-dDownsampleColorImages=true',
                                '-dDownsampleGrayImages=true',
                                '-dDownsampleMonoImages=true',
                            ]);
                        }

                        $pipes = [];

                        try {
                            $process = @proc_open($command, [
                                0 => ['pipe', 'r'],
                                1 => ['pipe', 'w'],
                                2 => ['pipe', 'w'],
                            ], $pipes);
                        } catch (\Throwable $exception) {
                            $lastCompressionError = $exception->getMessage();

                            continue;
                        }

                        if (!is_resource($process)) {
                            $lastCompressionError = "Unable to start {$binary}.";

                            continue;
                        }

                        if (isset($pipes[0]) && is_resource($pipes[0])) {
                            fclose($pipes[0]);
                        }

                        foreach ([1, 2] as $pipe) {
                            if (isset($pipes[$pipe]) && is_resource($pipes[$pipe])) {
                                stream_set_blocking($pipes[$pipe], false);
                            }
                        }

                        $startedAt = microtime(true);
                        $exitCode = null;
                        $timedOut = false;

                        do {
                            foreach ([1, 2] as $pipe) {
                                if (isset($pipes[$pipe]) && is_resource($pipes[$pipe])) {
                                    stream_get_contents($pipes[$pipe]);
                                }
                            }

                            $status = proc_get_status($process);

                            if (!($status['running'] ?? false)) {
                                $exitCode = $status['exitcode'] ?? null;
                                break;
                            }

                            if ((microtime(true) - $startedAt) >= $timeoutSeconds) {
                                $timedOut = true;
                                proc_terminate($process);
                                break;
                            }

                            usleep(100000);
                        } while (true);

                        foreach ([1, 2] as $pipe) {
                            if (isset($pipes[$pipe]) && is_resource($pipes[$pipe])) {
                                fclose($pipes[$pipe]);
                            }
                        }

                        $closeCode = proc_close($process);
                        $exitCode = $exitCode ?? $closeCode;

                        if ($timedOut) {
                            $lastCompressionError = "{$binary} timed out after {$timeoutSeconds} seconds.";
                            @unlink($compressedPath);

                            continue;
                        }

                        $compressedSize = is_file($compressedPath) ? (int) filesize($compressedPath) : 0;

                        if ($exitCode === 0 && $compressedSize > 0 && $compressedSize < $uploadSize) {
                            $uploadPath = $compressedPath;
                            $uploadMime = 'application/pdf';
                            $uploadSize = $compressedSize;
                            $lastCompressionError = null;
                            Log::info('PDF compression succeeded.', [
                                'storage_root' => trim($rootFolder, '/'),
                                'preset' => $preset,
                                'force_downsample' => $forceDownsample,
                                'image_dpi' => $forceDownsample ? $imageDpi : null,
                                'original_size' => $originalSize,
                                'compressed_size' => $compressedSize,
                            ]);
                            break;
                        }

                        if ($exitCode !== 0) {
                            $lastCompressionError = "{$binary} exited with code {$exitCode}.";
                        } elseif ($compressedSize <= 0) {
                            $lastCompressionError = "{$binary} did not produce a readable PDF.";
                        } else {
                            $lastCompressionError = "{$binary} produced a PDF that was not smaller than the original.";
                        }

                        @unlink($compressedPath);
                    }

                    if ($lastCompressionError !== null) {
                        Log::info('PDF compression skipped; uploading the original file.', [
                            'storage_root' => trim($rootFolder, '/'),
                            'reason' => $lastCompressionError,
                        ]);
                    }
                }
            }

            $body = $uploadPath ? fopen($uploadPath, 'rb') : false;

            if (!$body) {
                throw new \RuntimeException('Unable to read file for upload.');
            }

            Log::info('Supabase upload starting.', [
                'path' => $path,
                'upload_size' => $uploadSize,
                'original_size' => $originalSize,
                'used_compressed_file' => $uploadPath !== $sourcePath,
            ]);

            $response = Http::withHeaders([
                'apikey' => $serviceKey,
                'Authorization' => 'Bearer ' . $serviceKey,
                'x-upsert' => 'true',
                'Content-Type' => $uploadMime,
                'Content-Length' => (string) $uploadSize,
            ])->withBody(Utils::streamFor($body), $uploadMime)
                ->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");
        } finally {
            if (is_resource($body)) {
                fclose($body);
            }

            if ($compressedPath && is_file($compressedPath)) {
                @unlink($compressedPath);
            }
        }

        if ($response->failed()) {
            throw new \RuntimeException('Failed to upload file to storage.');
        }

        Log::info('Supabase upload completed.', [
            'path' => $path,
            'upload_size' => $uploadSize,
            'original_size' => $originalSize,
            'used_compressed_file' => $uploadPath !== $sourcePath,
        ]);

        return [
            'name' => $file->getClientOriginalName(),
            'size' => $uploadSize,
            'path' => $path,
            'url' => "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$path}",
        ];
    }
}
