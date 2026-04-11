<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
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

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'is_active' => true,
                    'sort_order' => $category['sort_order'],
                ],
            );
        }
    }
}
