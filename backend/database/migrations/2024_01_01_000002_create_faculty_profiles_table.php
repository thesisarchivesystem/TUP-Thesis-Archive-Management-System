<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('faculty_id')->unique();
            $table->string('department');
            $table->string('rank')->nullable();
            $table->string('faculty_role')->nullable();
            $table->uuid('assigned_chair_id')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['active', 'on_leave', 'inactive'])->default('active');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('assigned_chair_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_profiles');
    }
};
