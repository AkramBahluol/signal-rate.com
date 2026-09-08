<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operators', fn (Blueprint $table) => $table->boolean('four_g')->default(false));
    }

    public function down(): void
    {
        Schema::table('operators', fn (Blueprint $table) => $table->dropColumn('four_g'));
    }
};
