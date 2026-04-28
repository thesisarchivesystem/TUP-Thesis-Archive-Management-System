<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'CREATE INDEX IF NOT EXISTS theses_status_is_archived_category_id_archived_at_index
            ON theses (status, is_archived, category_id, archived_at DESC)'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS theses_status_is_archived_category_id_archived_at_index');
    }
};
