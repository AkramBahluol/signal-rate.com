<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $t): void {
            $t->id();
            $t->string('name');
            $t->string('official_name')->nullable();
            $t->string('iso2', 2)->unique();
            $t->string('iso3', 3)->unique();
            $t->string('numeric_code', 3)->nullable()->unique();
            $t->string('slug')->unique();
            $t->string('continent')->nullable();
            $t->string('currency_code', 3)->nullable();
            $t->json('timezones')->nullable();
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
        Schema::create('calling_codes', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('country_id')->constrained()->cascadeOnDelete();
            $t->string('code', 8)->index();
            $t->boolean('primary')->default(false);
            $t->timestamps();
        });
        Schema::create('operators', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('country_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('slug')->unique();
            $t->string('brand')->nullable();
            $t->string('website')->nullable();
            $t->json('technologies')->nullable();
            $t->string('mcc', 3)->nullable();
            $t->string('mnc', 3)->nullable();
            $t->boolean('prepaid')->default(false);
            $t->boolean('postpaid')->default(false);
            $t->boolean('esim')->default(false);
            $t->boolean('five_g')->default(false);
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
        Schema::create('mcc_mnc', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('operator_id')->nullable()->constrained()->nullOnDelete();
            $t->string('mcc', 3);
            $t->string('mnc', 3);
            $t->string('network_brand')->nullable();
            $t->json('technologies')->nullable();
            $t->boolean('active')->default(true);
            $t->timestamps();
            $t->unique(['mcc', 'mnc']);
        });
        Schema::create('mobile_plans', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('operator_id')->constrained()->cascadeOnDelete();
            $t->foreignId('country_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('slug')->unique();
            $t->string('plan_type');
            $t->decimal('price', 12, 2)->nullable();
            $t->string('currency', 3)->nullable();
            $t->string('billing_period')->nullable();
            $t->unsignedBigInteger('data_allowance_mb')->nullable();
            $t->boolean('unlimited_data')->default(false);
            $t->boolean('five_g')->default(false);
            $t->boolean('esim')->default(false);
            $t->boolean('roaming')->default(false);
            $t->string('source_url')->nullable();
            $t->timestamp('last_verified_at')->nullable();
            $t->string('verification_status')->default('unverified');
            $t->timestamps();
        });
        Schema::create('plan_price_history', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('mobile_plan_id')->constrained()->cascadeOnDelete();
            $t->decimal('price', 12, 2);
            $t->string('currency', 3);
            $t->date('effective_from');
            $t->date('effective_to')->nullable();
            $t->string('source_url')->nullable();
            $t->timestamps();
        });
        Schema::create('errors', function (Blueprint $t): void {
            $t->id();
            $t->string('category');
            $t->string('code');
            $t->string('slug')->unique();
            $t->string('title');
            $t->text('meaning')->nullable();
            $t->text('causes')->nullable();
            $t->text('solutions')->nullable();
            $t->timestamps();
            $t->unique(['category', 'code']);
        });
        foreach (['tools', 'guides', 'datasets'] as $table) {
            Schema::create($table, function (Blueprint $t): void {
                $t->id();
                $t->string('name')->nullable();
                $t->string('title')->nullable();
                $t->string('slug')->unique();
                $t->text('description')->nullable();
                $t->string('source_url')->nullable();
                $t->timestamps();
            });
        }
    }

    public function down(): void
    {
        foreach (['datasets', 'guides', 'tools', 'errors', 'plan_price_history', 'mobile_plans', 'mcc_mnc', 'operators', 'calling_codes', 'countries'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
