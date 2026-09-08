<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('errors', 'legacy_errors');

        Schema::create('error_families', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('source_name')->nullable();
            $table->string('source_url')->nullable();
            $table->string('source_type')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->string('verification_status')->default('unverified')->index();
            $table->boolean('active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('errors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('family_id')->constrained('error_families')->cascadeOnDelete();
            $table->string('code');
            $table->string('normalized_code');
            $table->string('slug');
            $table->string('title');
            $table->text('short_description');
            $table->text('meaning');
            $table->text('diagnosis')->nullable();
            $table->string('severity')->nullable();
            $table->string('status')->default('draft')->index();
            $table->string('source_name');
            $table->string('source_url');
            $table->string('source_type');
            $table->timestamp('last_verified_at')->nullable();
            $table->string('verification_status')->default('unverified')->index();
            $table->boolean('managed_by_import')->default(false);
            $table->string('content_hash', 64)->nullable();
            $table->timestamps();
            $table->unique(['family_id', 'normalized_code']);
            $table->unique(['family_id', 'slug']);
            $table->index(['family_id', 'status']);
        });

        Schema::create('error_aliases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('error_id')->constrained('errors')->cascadeOnDelete();
            $table->string('alias');
            $table->string('normalized_alias')->index();
            $table->unique(['error_id', 'normalized_alias']);
        });
        foreach (['error_causes', 'error_solutions'] as $name) {
            Schema::create($name, function (Blueprint $table): void {
                $table->id();
                $table->foreignId('error_id')->constrained('errors')->cascadeOnDelete();
                $table->text('body');
                $table->unsignedSmallInteger('position')->default(0);
                $table->index(['error_id', 'position']);
            });
        }
        Schema::create('error_examples', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('error_id')->constrained('errors')->cascadeOnDelete();
            $table->string('title');
            $table->string('language')->nullable();
            $table->text('code');
            $table->text('explanation')->nullable();
        });
        Schema::create('error_sources', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('error_id')->constrained('errors')->cascadeOnDelete();
            $table->string('title');
            $table->string('authority');
            $table->string('url');
            $table->string('source_type');
            $table->timestamp('last_verified_at')->nullable();
            $table->string('verification_status')->default('unverified');
        });
        Schema::create('error_relations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('error_id')->constrained('errors')->cascadeOnDelete();
            $table->foreignId('related_error_id')->constrained('errors')->cascadeOnDelete();
            $table->string('type');
            $table->string('note')->nullable();
            $table->unique(['error_id', 'related_error_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('error_relations');
        Schema::dropIfExists('error_sources');
        Schema::dropIfExists('error_examples');
        Schema::dropIfExists('error_solutions');
        Schema::dropIfExists('error_causes');
        Schema::dropIfExists('error_aliases');
        Schema::dropIfExists('errors');
        Schema::dropIfExists('error_families');
        Schema::rename('legacy_errors', 'errors');
    }
};
