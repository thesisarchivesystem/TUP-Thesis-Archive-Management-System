<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_file_recipients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('shared_file_id');
            $table->uuid('user_id');
            $table->timestamps();

            $table->foreign('shared_file_id')->references('id')->on('shared_files')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['shared_file_id', 'user_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_file_recipients');
    }
};
