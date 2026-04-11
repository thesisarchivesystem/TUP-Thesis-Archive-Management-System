<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vpaa_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->string('employee_id')->unique();
            $table->string('mobile')->nullable();
            $table->string('office')->nullable();
            $table->string('role_title')->nullable();
            $table->date('term_start')->nullable();
            $table->string('supervised_units')->nullable();
            $table->string('office_hours')->nullable();
            $table->string('signature_title')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vpaa_profiles');
    }
};
