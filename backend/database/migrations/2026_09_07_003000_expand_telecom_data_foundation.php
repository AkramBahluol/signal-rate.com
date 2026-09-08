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
                $t->string('source_type')->nullable()->index();
                $t->timestamp('retrieved_at')->nullable();
                $t->string('managed_by_import')->nullable()->index();
            });
        }

        Schema::table('operators', function (Blueprint $t): void {
            $t->boolean('prepaid')->nullable()->default(null)->change();
            $t->boolean('postpaid')->nullable()->default(null)->change();
            $t->boolean('esim')->nullable()->default(null)->change();
            $t->boolean('four_g')->nullable()->default(null)->change();
            $t->boolean('five_g')->nullable()->default(null)->change();
            $t->index(['country_id', 'verification_status', 'active']);
        });

        Schema::table('mcc_mnc', function (Blueprint $t): void {
            $t->unsignedTinyInteger('mnc_length')->nullable();
            $t->string('assignment_name')->nullable();
            $t->string('assignment_status')->default('unknown');
            $t->timestamp('last_seen_at')->nullable();
            $t->unsignedSmallInteger('missing_observations')->default(0);
            $t->string('content_hash', 64)->nullable();
            $t->index(['mcc', 'verification_status', 'active']);
            $t->index(['country_id', 'verification_status', 'active']);
        });

        Schema::create('telecom_sources', function (Blueprint $t): void {
            $t->id();
            $t->string('key')->unique();
            $t->string('name');
            $t->string('authority');
            $t->string('url');
            $t->string('source_type');
            $t->text('license_notes')->nullable();
            $t->string('attribution')->nullable();
            $t->boolean('active')->default(true);
            $t->timestamps();
        });

        Schema::create('telecom_snapshots', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('telecom_source_id')->constrained()->cascadeOnDelete();
            $t->string('dataset_type');
            $t->string('source_version')->nullable();
            $t->string('checksum', 64);
            $t->timestamp('retrieved_at');
            $t->unsignedInteger('record_count')->default(0);
            $t->longText('raw_payload');
            $t->timestamps();
            $t->unique(['telecom_source_id', 'dataset_type', 'checksum'], 'telecom_snapshot_identity');
            $t->index(['dataset_type', 'retrieved_at']);
        });

        Schema::create('mcc_mnc_changes', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('mcc_mnc_id')->nullable()->constrained('mcc_mnc')->nullOnDelete();
            $t->foreignId('telecom_snapshot_id')->constrained()->cascadeOnDelete();
            $t->string('change_type');
            $t->json('before')->nullable();
            $t->json('after')->nullable();
            $t->timestamps();
            $t->index(['change_type', 'created_at']);
        });

        Schema::create('mcc_mnc_conflicts', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('mcc_mnc_id')->constrained('mcc_mnc')->cascadeOnDelete();
            $t->foreignId('telecom_snapshot_id')->constrained()->cascadeOnDelete();
            $t->json('existing_value');
            $t->json('incoming_value');
            $t->string('status')->default('open');
            $t->text('resolution_notes')->nullable();
            $t->timestamps();
            $t->index(['status', 'created_at']);
        });

        Schema::create('operator_aliases', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('operator_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('normalized_name');
            $t->string('alias_type')->default('assignment');
            $t->string('source_name')->nullable();
            $t->string('source_url')->nullable();
            $t->string('source_type')->nullable();
            $t->timestamp('retrieved_at')->nullable();
            $t->timestamp('last_verified_at')->nullable();
            $t->string('verification_status')->default('unverified');
            $t->timestamps();
            $t->unique(['operator_id', 'normalized_name']);
            $t->index(['normalized_name', 'verification_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operator_aliases');
        Schema::dropIfExists('mcc_mnc_conflicts');
        Schema::dropIfExists('mcc_mnc_changes');
        Schema::dropIfExists('telecom_snapshots');
        Schema::dropIfExists('telecom_sources');

        Schema::table('mcc_mnc', function (Blueprint $t): void {
            $t->dropIndex(['mcc', 'verification_status', 'active']);
            $t->dropIndex(['country_id', 'verification_status', 'active']);
            $t->dropColumn(['mnc_length', 'assignment_name', 'assignment_status', 'last_seen_at', 'missing_observations', 'content_hash']);
        });
        Schema::table('operators', function (Blueprint $t): void {
            $t->dropIndex(['country_id', 'verification_status', 'active']);
            $t->boolean('prepaid')->nullable(false)->default(false)->change();
            $t->boolean('postpaid')->nullable(false)->default(false)->change();
            $t->boolean('esim')->nullable(false)->default(false)->change();
            $t->boolean('four_g')->nullable(false)->default(false)->change();
            $t->boolean('five_g')->nullable(false)->default(false)->change();
        });
        foreach (['countries', 'calling_codes', 'operators', 'mcc_mnc'] as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->dropIndex(['source_type']);
                $t->dropIndex(['managed_by_import']);
                $t->dropColumn(['source_type', 'retrieved_at', 'managed_by_import']);
            });
        }
    }
};
