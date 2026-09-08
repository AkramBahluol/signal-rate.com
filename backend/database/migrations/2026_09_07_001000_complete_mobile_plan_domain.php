<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mobile_plans', function (Blueprint $table): void {
            $table->string('status')->default('unknown')->index();
            $table->unsignedSmallInteger('billing_period_days')->nullable();
            $table->unsignedBigInteger('calls_allowance_minutes')->nullable();
            $table->boolean('unlimited_calls')->default(false);
            $table->unsignedBigInteger('sms_allowance')->nullable();
            $table->boolean('unlimited_sms')->default(false);
            $table->boolean('four_g')->default(false);
            $table->boolean('hotspot_allowed')->nullable();
            $table->unsignedBigInteger('hotspot_allowance_mb')->nullable();
            $table->text('roaming_notes')->nullable();
            $table->boolean('international_calls')->nullable();
            $table->text('international_notes')->nullable();
            $table->unsignedSmallInteger('contract_length_months')->nullable();
            $table->decimal('activation_fee', 12, 2)->default(0);
            $table->decimal('upfront_fee', 12, 2)->default(0);
            $table->text('fair_usage_policy')->nullable();
            $table->string('source_name')->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->unsignedSmallInteger('missing_observations')->default(0);
            $table->index(['country_id', 'status']);
            $table->index(['country_id', 'plan_type', 'price']);
            $table->index(['country_id', 'unlimited_data', 'five_g', 'esim']);
            $table->index(['operator_id', 'status']);
        });

        Schema::create('plan_sources', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('source_type')->default('operator');
            $table->string('url');
            $table->string('adapter_class');
            $table->boolean('active')->default(true);
            $table->timestamp('last_fetched_at')->nullable();
            $table->timestamps();
        });

        Schema::create('plan_source_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plan_source_id')->constrained()->cascadeOnDelete();
            $table->string('source_url');
            $table->string('checksum', 64);
            $table->string('fetch_status')->default('success');
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->json('payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('retrieved_at');
            $table->timestamps();
            $table->unique(['plan_source_id', 'checksum']);
            $table->index(['plan_source_id', 'retrieved_at']);
        });

        Schema::table('mobile_plans', function (Blueprint $table): void {
            $table->foreignId('plan_source_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source_key')->nullable();
            $table->unique(['plan_source_id', 'source_key']);
        });

        Schema::create('plan_prices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('mobile_plan_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->string('currency', 3);
            $table->string('billing_period')->nullable();
            $table->unsignedSmallInteger('billing_period_days')->nullable();
            $table->decimal('activation_fee', 12, 2)->default(0);
            $table->decimal('upfront_fee', 12, 2)->default(0);
            $table->boolean('is_current')->default(true);
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->timestamp('observed_at');
            $table->string('source_name')->nullable();
            $table->string('source_url')->nullable();
            $table->string('verification_status')->default('unverified');
            $table->timestamps();
            $table->index(['mobile_plan_id', 'is_current']);
            $table->index(['currency', 'price']);
        });

        Schema::create('plan_features', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('mobile_plan_id')->constrained()->cascadeOnDelete();
            $table->string('feature_key');
            $table->json('value');
            $table->string('source_name')->nullable();
            $table->string('source_url')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->string('verification_status')->default('unverified');
            $table->timestamps();
            $table->unique(['mobile_plan_id', 'feature_key']);
        });

        Schema::create('plan_verifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('mobile_plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_source_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('plan_source_snapshot_id')->nullable()->constrained()->nullOnDelete();
            $table->string('verification_status');
            $table->timestamp('checked_at');
            $table->string('source_name')->nullable();
            $table->string('source_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['mobile_plan_id', 'checked_at']);
        });

        Schema::create('plan_changes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('mobile_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('plan_source_id')->nullable()->constrained()->nullOnDelete();
            $table->string('change_type');
            $table->json('changes')->nullable();
            $table->timestamp('observed_at');
            $table->timestamps();
            $table->index(['mobile_plan_id', 'observed_at']);
        });

        Schema::table('plan_price_history', function (Blueprint $table): void {
            $table->decimal('previous_price', 12, 2)->nullable();
            $table->decimal('new_price', 12, 2)->nullable();
            $table->timestamp('observed_at')->nullable();
            $table->string('source_name')->nullable();
            $table->string('verification_status')->default('unverified');
            $table->index(['mobile_plan_id', 'observed_at']);
        });
    }

    public function down(): void
    {
        Schema::table('plan_price_history', function (Blueprint $table): void {
            $table->dropIndex(['mobile_plan_id', 'observed_at']);
            $table->dropColumn(['previous_price', 'new_price', 'observed_at', 'source_name', 'verification_status']);
        });
        Schema::dropIfExists('plan_changes');
        Schema::dropIfExists('plan_verifications');
        Schema::dropIfExists('plan_features');
        Schema::dropIfExists('plan_prices');
        Schema::table('mobile_plans', function (Blueprint $table): void {
            $table->dropUnique(['plan_source_id', 'source_key']);
            $table->dropConstrainedForeignId('plan_source_id');
            $table->dropColumn('source_key');
        });
        Schema::dropIfExists('plan_source_snapshots');
        Schema::dropIfExists('plan_sources');
        Schema::table('mobile_plans', function (Blueprint $table): void {
            $table->dropIndex(['country_id', 'status']);
            $table->dropIndex(['country_id', 'plan_type', 'price']);
            $table->dropIndex(['country_id', 'unlimited_data', 'five_g', 'esim']);
            $table->dropIndex(['operator_id', 'status']);
            $table->dropColumn(['status', 'billing_period_days', 'calls_allowance_minutes', 'unlimited_calls', 'sms_allowance', 'unlimited_sms', 'four_g', 'hotspot_allowed', 'hotspot_allowance_mb', 'roaming_notes', 'international_calls', 'international_notes', 'contract_length_months', 'activation_fee', 'upfront_fee', 'fair_usage_policy', 'source_name', 'first_seen_at', 'last_seen_at', 'missing_observations']);
        });
    }
};
