<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $departmentCollegeMap = config('academic.department_college_map', []);

        foreach ($departmentCollegeMap as $department => $college) {
            DB::table('faculty_profiles')
                ->where('department', $department)
                ->where(function ($query) use ($college) {
                    $query->whereNull('college')
                        ->orWhere('college', '')
                        ->orWhere('college', '!=', $college);
                })
                ->update(['college' => $college]);
        }
    }

    public function down(): void
    {
        // Intentionally left blank. This is a data-normalization migration.
    }
};
