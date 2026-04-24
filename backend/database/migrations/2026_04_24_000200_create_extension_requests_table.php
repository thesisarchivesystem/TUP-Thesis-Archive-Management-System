<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('extension_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('thesis_id');
            $table->uuid('student_id');
            $table->uuid('faculty_id');
            $table->date('requested_deadline');
            $table->text('reason');
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('thesis_id')->references('id')->on('theses')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('faculty_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['faculty_id', 'status', 'created_at']);
            $table->index(['student_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('extension_requests');
    }
};
