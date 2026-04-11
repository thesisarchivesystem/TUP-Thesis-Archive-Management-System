<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        $categories = [
            ['name' => 'Web & Mobile Development', 'description' => 'Portal systems, responsive platforms, mobile workflows, and service applications.', 'sort_order' => 1],
            ['name' => 'Artificial Intelligence & ML', 'description' => 'Machine learning, predictive systems, recommendation tools, and computer vision.', 'sort_order' => 2],
            ['name' => 'Cybersecurity & Networking', 'description' => 'Security, privacy, threat monitoring, and communication infrastructure.', 'sort_order' => 3],
            ['name' => 'IoT & Embedded Systems', 'description' => 'Sensor-driven platforms, automation, device integration, and smart monitoring.', 'sort_order' => 4],
            ['name' => 'Data Science & Analytics', 'description' => 'Dashboards, forecasting, reporting, and data-informed decision support.', 'sort_order' => 5],
            ['name' => 'Human-Computer Interaction', 'description' => 'Usability, accessibility, interface design, and user-centered systems.', 'sort_order' => 6],
            ['name' => 'Game Development', 'description' => 'Interactive experiences, simulations, multimedia, and learning environments.', 'sort_order' => 7],
            ['name' => 'Automation & Robotics', 'description' => 'Control systems, robotics, assisted processes, and automated operations.', 'sort_order' => 8],
            ['name' => 'General Research', 'description' => 'Fallback category for existing records that do not yet have a specific classification.', 'sort_order' => 999],
        ];

        DB::table('categories')->insert(array_map(static fn (array $category) => [
            'id' => (string) Str::uuid(),
            'name' => $category['name'],
            'slug' => Str::slug($category['name']),
            'description' => $category['description'],
            'is_active' => true,
            'sort_order' => $category['sort_order'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $categories));
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
