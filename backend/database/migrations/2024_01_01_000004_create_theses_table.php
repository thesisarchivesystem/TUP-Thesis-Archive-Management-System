<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('theses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('abstract')->nullable();
            $table->json('keywords')->default('[]');
            $table->string('department');
            $table->string('program')->nullable();
            $table->string('school_year')->nullable();
            $table->json('authors')->default('[]');
            $table->text('file_url')->nullable();
            $table->string('file_name')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->enum('status', ['draft', 'pending', 'under_review', 'approved', 'rejected'])->default('draft');
            $table->uuid('submitted_by');
            $table->uuid('adviser_id')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('adviser_remarks')->nullable();
            $table->integer('view_count')->default(0);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('submitted_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('adviser_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('theses');
    }
};
