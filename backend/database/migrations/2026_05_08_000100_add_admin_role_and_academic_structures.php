<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('vpaa', 'faculty', 'student', 'admin'))");

        Schema::create('colleges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('code', 50)->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('college_id');
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('college_id')->references('id')->on('colleges')->cascadeOnDelete();
            $table->unique(['college_id', 'name']);
            $table->unique(['college_id', 'code']);
        });

        Schema::create('programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('department_id');
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments')->cascadeOnDelete();
            $table->unique(['department_id', 'name']);
            $table->unique(['department_id', 'code']);
        });

        Schema::create('sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('program_id');
            $table->string('name');
            $table->string('code', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('program_id')->references('id')->on('programs')->cascadeOnDelete();
            $table->unique(['program_id', 'name']);
            $table->unique(['program_id', 'code']);
        });

        Schema::table('faculty_profiles', function (Blueprint $table) {
            $table->uuid('college_id')->nullable()->after('college');
            $table->uuid('department_id')->nullable()->after('college_id');

            $table->foreign('college_id')->references('id')->on('colleges')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->uuid('college_id')->nullable()->after('student_id');
            $table->uuid('department_id')->nullable()->after('college_id');
            $table->uuid('program_id')->nullable()->after('department_id');
            $table->uuid('section_id')->nullable()->after('program_id');
            $table->string('section')->nullable()->after('program');

            $table->foreign('college_id')->references('id')->on('colleges')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('program_id')->references('id')->on('programs')->nullOnDelete();
            $table->foreign('section_id')->references('id')->on('sections')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropForeign(['college_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['program_id']);
            $table->dropForeign(['section_id']);
            $table->dropColumn(['college_id', 'department_id', 'program_id', 'section_id', 'section']);
        });

        Schema::table('faculty_profiles', function (Blueprint $table) {
            $table->dropForeign(['college_id']);
            $table->dropForeign(['department_id']);
            $table->dropColumn(['college_id', 'department_id']);
        });

        Schema::dropIfExists('sections');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('colleges');

        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('vpaa', 'faculty', 'student'))");
    }
};
