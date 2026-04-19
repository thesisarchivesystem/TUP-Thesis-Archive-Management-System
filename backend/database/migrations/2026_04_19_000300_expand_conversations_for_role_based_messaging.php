<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->uuid('participant_one_id')->nullable()->after('faculty_id');
            $table->uuid('participant_two_id')->nullable()->after('participant_one_id');
        });

        DB::table('conversations')
            ->select(['id', 'student_id', 'faculty_id'])
            ->orderBy('id')
            ->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    $participants = collect([$row->student_id, $row->faculty_id])
                        ->filter()
                        ->sort()
                        ->values();

                    DB::table('conversations')
                        ->where('id', $row->id)
                        ->update([
                            'participant_one_id' => $participants->get(0),
                            'participant_two_id' => $participants->get(1),
                        ]);
                }
            }, 'id');

        DB::statement('ALTER TABLE conversations ALTER COLUMN student_id DROP NOT NULL');
        DB::statement('ALTER TABLE conversations ALTER COLUMN faculty_id DROP NOT NULL');

        Schema::table('conversations', function (Blueprint $table) {
            $table->foreign('participant_one_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('participant_two_id')->references('id')->on('users')->nullOnDelete();
            $table->unique(['participant_one_id', 'participant_two_id'], 'conversations_participants_unique');
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropUnique('conversations_participants_unique');
            $table->dropForeign(['participant_one_id']);
            $table->dropForeign(['participant_two_id']);
            $table->dropColumn(['participant_one_id', 'participant_two_id']);
        });

        DB::statement('ALTER TABLE conversations ALTER COLUMN student_id SET NOT NULL');
        DB::statement('ALTER TABLE conversations ALTER COLUMN faculty_id SET NOT NULL');
    }
};
