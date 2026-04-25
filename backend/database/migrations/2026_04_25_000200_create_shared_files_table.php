<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('uploaded_by');
            $table->uuid('category_id')->nullable();
            $table->string('title');
            $table->string('resource_type', 100);
            $table->text('abstract')->nullable();
            $table->json('keywords')->nullable();
            $table->json('authors')->nullable();
            $table->string('program')->nullable();
            $table->string('department');
            $table->string('college')->nullable();
            $table->string('school_year')->nullable();
            $table->string('share_scope', 50);
            $table->string('target_college')->nullable();
            $table->string('target_department')->nullable();
            $table->text('file_url')->nullable();
            $table->string('file_name')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->string('mime_type')->nullable();
            $table->boolean('is_draft')->default(false);
            $table->timestamp('shared_at')->nullable();
            $table->timestamps();

            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->index(['uploaded_by', 'created_at']);
            $table->index(['share_scope', 'target_college', 'target_department'], 'shared_files_scope_target_index');
            $table->index(['department', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_files');
    }
};
