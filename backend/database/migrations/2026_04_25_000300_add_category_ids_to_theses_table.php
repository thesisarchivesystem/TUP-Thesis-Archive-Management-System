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
            $table->json('category_ids')->default('[]')->after('category_id');
        });

        DB::table('theses')
            ->select(['id', 'category_id'])
            ->orderBy('id')
            ->chunkById(100, function ($theses) {
                foreach ($theses as $thesis) {
                    DB::table('theses')
                        ->where('id', $thesis->id)
                        ->update([
                            'category_ids' => json_encode($thesis->category_id ? [$thesis->category_id] : []),
                        ]);
                }
            }, 'id');
    }

    public function down(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->dropColumn('category_ids');
        });
    }
};
