<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['countries', 'calling_codes', 'operators', 'mcc_mnc'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->string('source_name')->nullable();
                $t->string('source_url')->nullable();
                $t->timestamp('last_verified_at')->nullable();
                $t->string('verification_status')->default('unverified');
            });
        }
    }

    public function down(): void
    {
        foreach (['countries', 'calling_codes', 'operators', 'mcc_mnc'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->dropColumn(['source_name', 'source_url', 'last_verified_at', 'verification_status']);
            });
        }
    }
};
