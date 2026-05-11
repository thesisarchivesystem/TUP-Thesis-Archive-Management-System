<?php

namespace App\Http\Controllers {
    use Tests\Feature\GhostscriptProcessFake;

    function proc_open(array|string $command, array $descriptor_spec, array &$pipes, ?string $cwd = null, ?array $env_vars = null, ?array $options = null): mixed
    {
        return GhostscriptProcessFake::procOpen($command, $descriptor_spec, $pipes, $cwd, $env_vars, $options);
    }

    function proc_get_status(mixed $process): array
    {
        return GhostscriptProcessFake::procGetStatus($process);
    }

    function proc_terminate(mixed $process, int $signal = 15): bool
    {
        return GhostscriptProcessFake::procTerminate($process, $signal);
    }

    function proc_close(mixed $process): int
    {
        return GhostscriptProcessFake::procClose($process);
    }
}

namespace App\Support {
    use Tests\Feature\GhostscriptProcessFake;

    function proc_open(array|string $command, array $descriptor_spec, array &$pipes, ?string $cwd = null, ?array $env_vars = null, ?array $options = null): mixed
    {
        return GhostscriptProcessFake::procOpen($command, $descriptor_spec, $pipes, $cwd, $env_vars, $options);
    }

    function proc_get_status(mixed $process): array
    {
        return GhostscriptProcessFake::procGetStatus($process);
    }

    function proc_terminate(mixed $process, int $signal = 15): bool
    {
        return GhostscriptProcessFake::procTerminate($process, $signal);
    }

    function proc_close(mixed $process): int
    {
        return GhostscriptProcessFake::procClose($process);
    }
}

namespace Tests\Feature {
    use App\Http\Controllers\AdminController;
    use App\Http\Controllers\FacultyController;
    use App\Http\Controllers\ThesisController;
    use App\Services\AblyService;
    use App\Services\ActivityLogService;
    use App\Services\DailyQuoteService;
    use App\Services\NotificationService;
    use Illuminate\Http\UploadedFile;
    use Illuminate\Support\Facades\Config;
    use Illuminate\Support\Facades\Http;
    use Mockery;
    use Tests\TestCase;

    class GhostscriptProcessFake
    {
        public static bool $enabled = false;

        public static int $exitCode = 0;

        public static ?string $compressedContent = null;

        public static array $commands = [];

        public static bool $keepRunning = false;

        public static bool $terminated = false;

        public static function reset(): void
        {
            self::$enabled = false;
            self::$exitCode = 0;
            self::$compressedContent = null;
            self::$commands = [];
            self::$keepRunning = false;
            self::$terminated = false;
        }

        public static function procOpen(array|string $command, array $descriptorSpec, array &$pipes, ?string $cwd = null, ?array $envVars = null, ?array $options = null): mixed
        {
            if (! self::$enabled) {
                return \proc_open($command, $descriptorSpec, $pipes, $cwd, $envVars, $options);
            }

            self::$commands[] = $command;

            $pipes = [
                0 => fopen('php://temp', 'r+'),
                1 => fopen('php://temp', 'r+'),
                2 => fopen('php://temp', 'r+'),
            ];

            if (self::$compressedContent !== null && ($outputPath = self::outputPathFromCommand($command))) {
                file_put_contents($outputPath, self::$compressedContent);
            }

            return fopen('php://temp', 'r+');
        }

        public static function procGetStatus(mixed $process): array
        {
            if (! self::$enabled) {
                return \proc_get_status($process);
            }

            if (self::$keepRunning) {
                return [
                    'running' => true,
                    'exitcode' => -1,
                ];
            }

            return [
                'running' => false,
                'exitcode' => self::$exitCode,
            ];
        }

        public static function procTerminate(mixed $process, int $signal = 15): bool
        {
            if (! self::$enabled) {
                return \proc_terminate($process, $signal);
            }

            self::$terminated = true;

            return true;
        }

        public static function procClose(mixed $process): int
        {
            if (! self::$enabled) {
                return \proc_close($process);
            }

            if (is_resource($process)) {
                fclose($process);
            }

            return self::$exitCode;
        }

        private static function outputPathFromCommand(array|string $command): ?string
        {
            foreach ((array) $command as $argument) {
                if (is_string($argument) && str_starts_with($argument, '-sOutputFile=')) {
                    return substr($argument, strlen('-sOutputFile='));
                }
            }

            return null;
        }
    }

    class ThesisUploadCompressionTest extends TestCase
    {
        private string $uploadedBody = '';

        protected function tearDown(): void
        {
            GhostscriptProcessFake::reset();
            Mockery::close();

            parent::tearDown();
        }

        public function test_pdf_upload_uses_compressed_file_when_ghostscript_succeeds(): void
        {
            $originalPdf = $this->samplePdf(str_repeat('large-image-payload', 500));
            $compressedPdf = $this->samplePdf('compressed');

            $this->configureSupabase();
            Config::set('services.pdf_compression.enabled', true);
            Config::set('services.pdf_compression.preset', 'ebook');

            GhostscriptProcessFake::$enabled = true;
            GhostscriptProcessFake::$compressedContent = $compressedPdf;

            $result = $this->invokeUpload(UploadedFile::fake()->createWithContent('thesis.pdf', $originalPdf));

            $this->assertSame(strlen($compressedPdf), $result['size']);
            $this->assertSame($compressedPdf, $this->uploadedBody);
            $this->assertNotEmpty(GhostscriptProcessFake::$commands);
            $this->assertContains('-dPDFSETTINGS=/ebook', GhostscriptProcessFake::$commands[0]);

            Http::assertSent(function ($request) use ($compressedPdf) {
                return $request->method() === 'POST'
                    && str_starts_with($request->url(), 'https://example.supabase.co/storage/v1/object/archive/student-theses/manuscripts/')
                    && $request->hasHeader('Content-Type', 'application/pdf')
                    && $request->hasHeader('Content-Length', (string) strlen($compressedPdf));
            });
        }

        public function test_pdf_upload_falls_back_to_original_when_ghostscript_fails(): void
        {
            $originalPdf = $this->samplePdf('original file body');

            $this->configureSupabase();
            Config::set('services.pdf_compression.enabled', true);
            Config::set('services.pdf_compression.preset', 'screen');

            GhostscriptProcessFake::$enabled = true;
            GhostscriptProcessFake::$exitCode = 1;
            GhostscriptProcessFake::$compressedContent = null;

            $result = $this->invokeUpload(UploadedFile::fake()->createWithContent('thesis.pdf', $originalPdf));

            $this->assertSame(strlen($originalPdf), $result['size']);
            $this->assertSame($originalPdf, $this->uploadedBody);
            $this->assertNotEmpty(GhostscriptProcessFake::$commands);

            Http::assertSent(function ($request) use ($originalPdf) {
                return $request->method() === 'POST'
                    && str_starts_with($request->url(), 'https://example.supabase.co/storage/v1/object/archive/student-theses/manuscripts/')
                    && $request->hasHeader('Content-Type', 'application/pdf')
                    && $request->hasHeader('Content-Length', (string) strlen($originalPdf));
            });
        }

        public function test_pdf_upload_falls_back_when_ghostscript_times_out(): void
        {
            $originalPdf = $this->samplePdf(str_repeat('slow-payload', 500));

            $this->configureSupabase();
            Config::set('services.pdf_compression.enabled', true);
            Config::set('services.pdf_compression.timeout', 1);

            GhostscriptProcessFake::$enabled = true;
            GhostscriptProcessFake::$keepRunning = true;

            $result = $this->invokeUpload(UploadedFile::fake()->createWithContent('slow-thesis.pdf', $originalPdf));

            $this->assertSame(strlen($originalPdf), $result['size']);
            $this->assertSame($originalPdf, $this->uploadedBody);
            $this->assertTrue(GhostscriptProcessFake::$terminated);
        }

        public function test_pdf_upload_can_force_screen_downsampling_options(): void
        {
            $originalPdf = $this->samplePdf(str_repeat('image-payload', 500));
            $compressedPdf = $this->samplePdf('small');

            $this->configureSupabase();
            Config::set('services.pdf_compression.enabled', true);
            Config::set('services.pdf_compression.preset', 'screen');
            Config::set('services.pdf_compression.force_downsample', true);
            Config::set('services.pdf_compression.image_dpi', 72);

            GhostscriptProcessFake::$enabled = true;
            GhostscriptProcessFake::$compressedContent = $compressedPdf;

            $result = $this->invokeUpload(UploadedFile::fake()->createWithContent('thesis.pdf', $originalPdf));

            $this->assertSame(strlen($compressedPdf), $result['size']);
            $this->assertContains('-dPDFSETTINGS=/screen', GhostscriptProcessFake::$commands[0]);
            $this->assertContains('-dColorImageResolution=72', GhostscriptProcessFake::$commands[0]);
            $this->assertContains('-dGrayImageResolution=72', GhostscriptProcessFake::$commands[0]);
            $this->assertContains('-dMonoImageResolution=72', GhostscriptProcessFake::$commands[0]);
            $this->assertContains('-dDownsampleColorImages=true', GhostscriptProcessFake::$commands[0]);
            $this->assertContains('-dDownsampleGrayImages=true', GhostscriptProcessFake::$commands[0]);
            $this->assertContains('-dDownsampleMonoImages=true', GhostscriptProcessFake::$commands[0]);
        }

        public function test_admin_thesis_uploads_use_pdf_compression(): void
        {
            $originalPdf = $this->samplePdf(str_repeat('admin-payload', 500));
            $compressedPdf = $this->samplePdf('small-admin');

            $this->configureSupabase();
            Config::set('services.pdf_compression.enabled', true);
            Config::set('services.pdf_compression.preset', 'screen');
            Config::set('services.pdf_compression.force_downsample', true);
            Config::set('services.pdf_compression.image_dpi', 72);

            GhostscriptProcessFake::$enabled = true;
            GhostscriptProcessFake::$compressedContent = $compressedPdf;

            $controller = new AdminController(Mockery::mock(ActivityLogService::class));
            $result = $this->invokeControllerUpload($controller, UploadedFile::fake()->createWithContent('admin-thesis.pdf', $originalPdf));

            $this->assertSame(strlen($compressedPdf), $result['size']);
            $this->assertStringStartsWith('admin-theses/manuscripts/', $result['path']);
            $this->assertSame($compressedPdf, $this->uploadedBody);
        }

        public function test_faculty_thesis_uploads_use_pdf_compression(): void
        {
            $originalPdf = $this->samplePdf(str_repeat('faculty-payload', 500));
            $compressedPdf = $this->samplePdf('small-faculty');

            $this->configureSupabase();
            Config::set('services.pdf_compression.enabled', true);
            Config::set('services.pdf_compression.preset', 'screen');
            Config::set('services.pdf_compression.force_downsample', true);
            Config::set('services.pdf_compression.image_dpi', 72);

            GhostscriptProcessFake::$enabled = true;
            GhostscriptProcessFake::$compressedContent = $compressedPdf;

            $controller = new FacultyController(
                Mockery::mock(ActivityLogService::class),
                Mockery::mock(DailyQuoteService::class),
                Mockery::mock(NotificationService::class),
            );
            $result = $this->invokeControllerUpload($controller, UploadedFile::fake()->createWithContent('faculty-thesis.pdf', $originalPdf));

            $this->assertSame(strlen($compressedPdf), $result['size']);
            $this->assertStringStartsWith('faculty-theses/manuscripts/', $result['path']);
            $this->assertSame($compressedPdf, $this->uploadedBody);
        }

        private function configureSupabase(): void
        {
            Config::set('services.supabase.url', 'https://example.supabase.co');
            Config::set('services.supabase.service_key', 'service-key');
            Config::set('services.supabase.bucket', 'archive');

            Http::fake([
                'https://example.supabase.co/storage/v1/object/*' => function ($request) {
                    $this->uploadedBody = $request->body();

                    return Http::response(['Key' => 'student-theses/manuscripts/example.pdf'], 200);
                },
            ]);
        }

        private function invokeUpload(UploadedFile $file): array
        {
            $controller = new ThesisController(
                Mockery::mock(AblyService::class),
                Mockery::mock(ActivityLogService::class),
                Mockery::mock(NotificationService::class),
            );

            return $this->invokeControllerUpload($controller, $file);
        }

        private function invokeControllerUpload(object $controller, UploadedFile $file): array
        {
            $method = new \ReflectionMethod($controller, 'uploadToSupabase');
            $method->setAccessible(true);

            return $method->invoke($controller, $file, 'manuscripts');
        }

        private function samplePdf(string $payload): string
        {
            return "%PDF-1.4\n"
                ."1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
                ."2 0 obj\n<< /Type /Pages /Count 0 >>\nendobj\n"
                .$payload
                ."\n%%EOF\n";
        }
    }
}
