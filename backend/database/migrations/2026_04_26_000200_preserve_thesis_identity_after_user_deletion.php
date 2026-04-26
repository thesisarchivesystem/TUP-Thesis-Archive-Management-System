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
            $table->string('submitter_name')->nullable()->after('submitted_by');
            $table->string('adviser_name')->nullable()->after('adviser_id');
            $table->uuid('archived_by')->nullable()->after('archived_at');
            $table->string('archived_by_name')->nullable()->after('archived_by');
        });

        DB::statement(<<<'SQL'
            UPDATE theses
            SET
                submitter_name = COALESCE(
                    submitter_name,
                    (SELECT users.name FROM users WHERE users.id = theses.submitted_by LIMIT 1)
                ),
                adviser_name = COALESCE(
                    adviser_name,
                    (SELECT users.name FROM users WHERE users.id = theses.adviser_id LIMIT 1)
                )
        SQL);

        Schema::table('theses', function (Blueprint $table) {
            $table->dropForeign(['submitted_by']);
        });

        DB::statement('ALTER TABLE theses ALTER COLUMN submitted_by DROP NOT NULL');

        Schema::table('theses', function (Blueprint $table) {
            $table->foreign('submitted_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('archived_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('theses', function (Blueprint $table) {
            $table->dropForeign(['archived_by']);
            $table->dropForeign(['submitted_by']);
        });

        $fallbackUserId = DB::table('users')->value('id');

        if ($fallbackUserId) {
            DB::table('theses')
                ->whereNull('submitted_by')
                ->update(['submitted_by' => $fallbackUserId]);
        } else {
            DB::table('theses')->whereNull('submitted_by')->delete();
        }

        DB::statement('ALTER TABLE theses ALTER COLUMN submitted_by SET NOT NULL');

        Schema::table('theses', function (Blueprint $table) {
            $table->foreign('submitted_by')->references('id')->on('users')->cascadeOnDelete();
            $table->dropColumn(['submitter_name', 'adviser_name', 'archived_by', 'archived_by_name']);
        });
    }
};
