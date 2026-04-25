<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->index(['adviser_id', 'created_at'], 'student_profiles_adviser_created_at_index');
        });

        Schema::table('theses', function (Blueprint $table) {
            $table->index(['submitted_by', 'updated_at', 'created_at'], 'theses_submitted_by_updated_at_created_at_index');
            $table->index(['adviser_id', 'status', 'submitted_at'], 'theses_adviser_status_submitted_at_index');
            $table->index(['adviser_id', 'status', 'approved_at'], 'theses_adviser_status_approved_at_index');
            $table->index(['status', 'approved_at'], 'theses_status_approved_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropIndex('student_profiles_adviser_created_at_index');
        });

        Schema::table('theses', function (Blueprint $table) {
            $table->dropIndex('theses_submitted_by_updated_at_created_at_index');
            $table->dropIndex('theses_adviser_status_submitted_at_index');
            $table->dropIndex('theses_adviser_status_approved_at_index');
            $table->dropIndex('theses_status_approved_at_index');
        });
    }
};
