<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('countries', fn (Blueprint $table) => $table->string('currency_name')->nullable());
    }

    public function down(): void
    {
        Schema::table('countries', fn (Blueprint $table) => $table->dropColumn('currency_name'));
    }
};
