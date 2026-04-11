<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->uuid('category_id')->nullable()->after('program');
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });

        $generalResearchId = DB::table('categories')->where('slug', 'general-research')->value('id');

        if ($generalResearchId) {
            DB::table('theses')->whereNull('category_id')->update(['category_id' => $generalResearchId]);
        }
    }

    public function down(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};
