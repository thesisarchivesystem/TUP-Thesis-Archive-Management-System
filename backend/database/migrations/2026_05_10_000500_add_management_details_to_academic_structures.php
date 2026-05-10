<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('colleges', function (Blueprint $table) {
            $table->string('dean_head')->nullable()->after('code');
            $table->string('dean_head_email')->nullable()->after('dean_head');
            $table->text('description')->nullable()->after('dean_head_email');
            $table->string('office_location')->nullable()->after('description');
            $table->string('contact_number')->nullable()->after('office_location');
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->string('chairperson')->nullable()->after('code');
            $table->string('chairperson_email')->nullable()->after('chairperson');
            $table->text('description')->nullable()->after('chairperson_email');
            $table->string('office_location')->nullable()->after('description');
            $table->string('contact_number')->nullable()->after('office_location');
        });

        Schema::table('programs', function (Blueprint $table) {
            $table->string('coordinator')->nullable()->after('code');
            $table->string('contact_email')->nullable()->after('coordinator');
            $table->text('description')->nullable()->after('contact_email');
            $table->string('curriculum_type')->nullable()->after('description');
            $table->string('year_duration')->nullable()->after('curriculum_type');
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn(['coordinator', 'contact_email', 'description', 'curriculum_type', 'year_duration']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn(['chairperson', 'chairperson_email', 'description', 'office_location', 'contact_number']);
        });

        Schema::table('colleges', function (Blueprint $table) {
            $table->dropColumn(['dean_head', 'dean_head_email', 'description', 'office_location', 'contact_number']);
        });
    }
};
