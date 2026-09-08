<?php

namespace Tests\Feature;

use App\Models\ErrorEntry;
use App\Services\Errors\ErrorDatasetImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ErrorKnowledgeApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        app(ErrorDatasetImporter::class)->import(database_path('data/errors.json'));
    }

    public function test_family_directory_includes_only_populated_families(): void
    {
        $this->getJson('/api/v1/error-families')->assertOk()->assertJsonCount(6, 'data')->assertJsonPath('data.0.error_count', 43);
    }

    public function test_representative_family_lookups_include_provenance_and_guidance(): void
    {
        foreach ([['http', '404'], ['mysql', '1064'], ['postgresql', '23505'], ['smpp', '0000000d'], ['php', 'type-error'], ['laravel', 'route-not-defined']] as [$family, $code]) {
            $this->getJson("/api/v1/errors/{$family}/{$code}")->assertOk()
                ->assertJsonPath('data.verification_status', 'verified')
                ->assertJsonStructure(['data' => ['meaning', 'diagnosis', 'causes', 'solutions', 'examples', 'sources']]);
        }
    }

    public function test_postgresql_and_smpp_normalization_and_alias_search_work(): void
    {
        $this->getJson('/api/v1/errors/postgresql/42p01')->assertOk()->assertJsonPath('data.normalized_code', '42P01');
        $this->getJson('/api/v1/errors/smpp/0x0000000d')->assertOk()->assertJsonPath('data.normalized_code', '0000000D');
        $this->getJson('/api/v1/errors/smpp/13')->assertOk()->assertJsonPath('data.title', 'Bind failed');
        $this->getJson('/api/v1/errors/search?q=unique%20violation')->assertOk()->assertJsonFragment(['normalized_code' => '23505']);
        $this->getJson('/api/v1/errors/search?q=ESME_RBINDFAIL')->assertOk()->assertJsonFragment(['normalized_code' => '0000000D']);
    }

    public function test_family_filter_and_global_search_include_errors(): void
    {
        $this->getJson('/api/v1/errors?family=mysql&query=syntax')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.code', '1064');
        $this->getJson('/api/v1/search?q=mysql%201064')->assertOk()->assertJsonFragment(['type' => 'error', 'url' => '/errors/mysql/1064']);
    }

    public function test_missing_invalid_and_draft_records_are_not_public(): void
    {
        $this->getJson('/api/v1/errors/http/999')->assertStatus(422);
        $this->getJson('/api/v1/errors/http/499')->assertNotFound();
        $draft = ErrorEntry::where('normalized_code', '404')->firstOrFail();
        $draft->update(['status' => 'draft']);
        $this->getJson('/api/v1/errors/http/404')->assertNotFound();
        $this->getJson('/api/v1/errors/search?q=404')->assertOk()->assertJsonMissing(['normalized_code' => '404']);
        $this->getJson('/api/v1/errors?code=404')->assertStatus(422);
    }

    public function test_deprecated_records_remain_accessible_but_leave_public_lists(): void
    {
        ErrorEntry::where('normalized_code', '404')->firstOrFail()->update(['status' => 'deprecated']);
        $this->getJson('/api/v1/errors/http/404')->assertOk()->assertJsonPath('data.status', 'deprecated');
        $this->getJson('/api/v1/errors?family=http&query=404')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_related_errors_are_meaningful_and_bidirectional(): void
    {
        $this->getJson('/api/v1/errors/http/401')->assertOk()->assertJsonFragment(['normalized_code' => '403', 'relation_type' => 'commonly-confused']);
        $this->getJson('/api/v1/errors/postgresql/23505')->assertOk()->assertJsonFragment(['normalized_code' => '1062', 'relation_type' => 'similar']);
    }

    public function test_import_is_idempotent_and_preserves_manual_entries(): void
    {
        $importer = app(ErrorDatasetImporter::class);
        $before = ErrorEntry::count();
        $importer->import(database_path('data/errors.json'));
        $this->assertSame($before, ErrorEntry::count());
        $entry = ErrorEntry::where('normalized_code', '404')->firstOrFail();
        $entry->update(['managed_by_import' => false, 'title' => 'Manually enriched title']);
        $importer->import(database_path('data/errors.json'));
        $this->assertSame('Manually enriched title', $entry->fresh()->title);
    }
}
