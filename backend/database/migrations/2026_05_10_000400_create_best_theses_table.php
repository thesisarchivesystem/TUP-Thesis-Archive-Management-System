<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('best_theses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('thesis_id');
            $table->string('school_year');
            $table->text('remarks')->nullable();
            $table->uuid('awarded_by')->nullable();
            $table->timestamp('awarded_at')->nullable();
            $table->timestamps();

            $table->unique('school_year');
            $table->foreign('thesis_id')->references('id')->on('theses')->onDelete('cascade');
            $table->foreign('awarded_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('best_theses');
    }
};
