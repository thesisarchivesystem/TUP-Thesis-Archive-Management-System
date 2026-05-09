<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->uuid('course_id')->nullable();
            $table->string('course')->nullable();
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->uuid('course_id')->nullable();
        });

        Schema::table('theses', function (Blueprint $table) {
            $table->string('course')->nullable();
        });

        Schema::table('shared_files', function (Blueprint $table) {
            $table->string('course')->nullable();
        });

        DB::statement('UPDATE student_profiles SET course_id = program_id WHERE course_id IS NULL AND program_id IS NOT NULL');
        DB::statement('UPDATE student_profiles SET course = program WHERE course IS NULL AND program IS NOT NULL');
        DB::statement('UPDATE sections SET course_id = program_id WHERE course_id IS NULL AND program_id IS NOT NULL');
        DB::statement('UPDATE theses SET course = program WHERE course IS NULL AND program IS NOT NULL');
        DB::statement('UPDATE shared_files SET course = program WHERE course IS NULL AND program IS NOT NULL');

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->foreign('course_id')->references('id')->on('programs')->nullOnDelete();
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->foreign('course_id')->references('id')->on('programs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
        });

        Schema::table('shared_files', function (Blueprint $table) {
            $table->dropColumn('course');
        });

        Schema::table('theses', function (Blueprint $table) {
            $table->dropColumn('course');
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->dropColumn('course_id');
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn(['course_id', 'course']);
        });
    }
};
