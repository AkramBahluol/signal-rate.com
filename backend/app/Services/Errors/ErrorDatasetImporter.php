<?php

namespace App\Services\Errors;

use App\Models\ErrorEntry;
use App\Models\ErrorFamily;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ErrorDatasetImporter
{
    public function __construct(private readonly ErrorNormalizer $normalizer) {}

    public function import(string $path): array
    {
        $payload = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
        if (($payload['version'] ?? null) !== 1 || ! is_array($payload['families'] ?? null)) {
            throw new InvalidArgumentException('Unsupported or invalid error dataset.');
        }

        $result = DB::transaction(function () use ($payload): array {
            $imported = 0;
            foreach ($payload['families'] as $familyData) {
                $family = $this->family($familyData, $payload['verified_at']);
                foreach ($familyData['entries'] as $row) {
                    $this->entry($family, $familyData, $row, $payload['verified_at']);
                    $imported++;
                }
            }
            $this->relations($payload['relations'] ?? []);

            return ['families' => count($payload['families']), 'errors' => $imported];
        });
        Cache::forget('errors:families:v2');

        return $result;
    }

    private function family(array $data, string $verifiedAt): ErrorFamily
    {
        foreach (['key', 'name', 'description', 'source', 'entries'] as $field) {
            if (empty($data[$field])) {
                throw new InvalidArgumentException("Family field {$field} is required.");
            }
        }

        return ErrorFamily::updateOrCreate(['key' => $data['key']], [
            'name' => $data['name'], 'slug' => $data['key'], 'description' => $data['description'],
            'source_name' => $data['source']['name'], 'source_url' => $data['source']['url'],
            'source_type' => $data['source']['type'], 'last_verified_at' => $verifiedAt,
            'verification_status' => 'verified', 'active' => true,
        ]);
    }

    private function entry(ErrorFamily $family, array $familyData, array $row, string $verifiedAt): void
    {
        [$code, $title, $description] = $row;
        $source = $familyData['source'];
        if (! empty($row[5])) {
            $source['url'] = $row[5];
            $source['name'] = $row[6] ?? $source['name'];
            $source['type'] = $row[7] ?? $source['type'];
        }
        $normalized = $this->normalizer->code($family->key, $code);
        $slug = in_array($family->key, ['php', 'laravel'], true) ? $normalized : strtolower($normalized);
        $aliases = array_values(array_unique(array_filter([$code, $title, $row[3] ?? null, $row[4] ?? null, ...$this->extraAliases($family->key, $normalized)])));
        $guidance = $this->guidance($family->key, $normalized, $title, $description);
        $data = [
            'code' => $code, 'normalized_code' => $normalized, 'slug' => $slug, 'title' => $title,
            'short_description' => $description, 'meaning' => $guidance['meaning'], 'diagnosis' => $guidance['diagnosis'],
            'status' => 'published', 'source_name' => $source['name'],
            'source_url' => $source['url'], 'source_type' => $source['type'],
            'last_verified_at' => $verifiedAt, 'verification_status' => 'verified', 'managed_by_import' => true,
        ];
        $data['content_hash'] = hash('sha256', json_encode([$data, $aliases, $guidance], JSON_THROW_ON_ERROR));
        $existing = ErrorEntry::where('family_id', $family->id)->where('normalized_code', $normalized)->first();
        if ($existing && ! $existing->managed_by_import) {
            return;
        }
        $error = ErrorEntry::updateOrCreate(['family_id' => $family->id, 'normalized_code' => $normalized], $data);

        $error->aliases()->delete();
        foreach ($aliases as $alias) {
            $error->aliases()->create(['alias' => $alias, 'normalized_alias' => $this->normalizer->alias($alias)]);
        }
        $error->causes()->delete();
        foreach ($guidance['causes'] as $position => $body) {
            $error->causes()->create(compact('body', 'position'));
        }
        $error->solutions()->delete();
        foreach ($guidance['solutions'] as $position => $body) {
            $error->solutions()->create(compact('body', 'position'));
        }
        $error->examples()->delete();
        $error->examples()->create($guidance['example']);
        $error->sources()->delete();
        $error->sources()->create([
            'title' => $source['name'], 'authority' => parse_url($source['url'], PHP_URL_HOST),
            'url' => $source['url'], 'source_type' => $source['type'],
            'last_verified_at' => $verifiedAt, 'verification_status' => 'verified',
        ]);
        $this->assertPublishable($error->fresh(['causes', 'solutions', 'sources']));
    }

    private function assertPublishable(ErrorEntry $error): void
    {
        $officialSources = $error->sources->filter(fn ($source) => $source->verification_status === 'verified'
            && parse_url($source->url, PHP_URL_SCHEME) === 'https'
            && in_array($source->source_type, ['standard', 'official-vendor-documentation', 'official-language-documentation', 'official-framework-documentation', 'maintainer-documentation'], true));
        if (! $error->title || ! $error->meaning || ! $error->diagnosis || $error->causes->isEmpty() || $error->solutions->isEmpty() || $officialSources->isEmpty()) {
            throw new InvalidArgumentException("Error {$error->normalized_code} does not pass the publication quality gate.");
        }
    }

    private function extraAliases(string $family, string $code): array
    {
        return $family === 'smpp' ? ['0x'.$code, (string) hexdec($code)] : [];
    }

    private function guidance(string $family, string $code, string $title, string $description): array
    {
        $base = match ($family) {
            'http' => $this->httpGuidance((int) $code, $title),
            'mysql' => $this->databaseGuidance('MySQL', $code, $title),
            'postgresql' => $this->databaseGuidance('PostgreSQL', $code, $title),
            'smpp' => $this->smppGuidance($code, $title),
            'php' => $this->phpGuidance($title),
            'laravel' => $this->laravelGuidance($code, $title),
            default => throw new InvalidArgumentException('Unsupported family.'),
        };
        $base['meaning'] = $description.' '.$base['context'];
        unset($base['context']);

        return $base;
    }

    private function httpGuidance(int $code, string $title): array
    {
        $class = intdiv($code, 100);
        $defaults = match ($class) {
            1 => ['Confirm the client expects an interim response and continues the exchange.', ['An intermediary handled the protocol transition differently.', 'The client and server disagree about request-body or upgrade behavior.'], ['Capture the complete HTTP exchange, including interim responses.', 'Check proxy support for the requested protocol behavior.']],
            2 => ['Verify that the successful response body and headers match the API contract.', ['The operation intentionally returns this success form.', 'A proxy or application transformed the success response.'], ['Inspect the final response headers and payload.', 'Confirm client handling for responses with an empty or partial body.']],
            3 => ['Follow the Location header and inspect the redirect chain, method, and cache policy.', ['A route or canonical-host rule redirected the request.', 'Proxy, TLS, or trailing-slash configuration produced a redirect.'], ['Inspect Location without blindly following redirects.', 'Remove loops and choose the redirect status whose method semantics match the intent.']],
            4 => ['Reproduce the exact request and compare its URL, method, headers, credentials, and body with the endpoint contract.', ['The client sent an invalid or unsupported request.', 'Authentication, authorization, routing, content, or rate policy rejected it.'], ['Inspect the response body and request correlation ID.', 'Correct the request or server policy indicated by logs; do not retry unchanged requests automatically.']],
            default => ['Trace the request through the edge, proxy, application, and upstream dependencies to find the component that emitted the response.', ['The server or an upstream dependency failed while processing a valid request.', 'Capacity, deployment, configuration, timeout, or application errors interrupted processing.'], ['Check service health, structured logs, and request IDs at every hop.', 'Restore the failing dependency or configuration before retrying with bounded backoff.']],
        };
        $special = [
            404 => [['The URL or route is misspelled or no longer registered.', 'The resource was deleted, moved, or omitted from the deployment.'], ['Compare the decoded request path with the router table.', 'Check deployment artifacts and application logs; use 410 only when removal is known to be permanent.']],
            401 => [['Credentials are missing, expired, malformed, or rejected.', 'The selected authentication scheme is not accepted for this resource.'], ['Inspect WWW-Authenticate and refresh or correct credentials.', 'Keep authentication failures distinct from an authenticated user lacking permission.']],
            403 => [['The authenticated principal lacks permission.', 'A firewall, ownership, or application policy denies access.'], ['Confirm identity and authorization policy separately.', 'Review access-control logs without exposing protected resource details.']],
            429 => [['A client, token, or IP exceeded a configured rate limit.', 'A shared retry loop or burst consumed the available quota.'], ['Inspect Retry-After and rate-limit headers.', 'Apply bounded exponential backoff and reduce concurrency or request volume.']],
            502 => [['The upstream service is down, resetting connections, or speaking an unexpected protocol.', 'The proxy targets the wrong host, port, TLS mode, or response format.'], ['Check upstream service health and connect to its configured port from the proxy.', 'Inspect proxy and application logs, then verify protocol and timeout settings.']],
            503 => [['The service is overloaded, in maintenance, or has no healthy instances.', 'A required dependency is unavailable.'], ['Check capacity, deployment health, and dependency status.', 'Honor Retry-After when present and retry only with bounded backoff.']],
            504 => [['The upstream exceeded the gateway timeout.', 'A slow database, external API, or saturated worker delayed the response.'], ['Measure latency at each hop and inspect the slow operation.', 'Fix the bottleneck before increasing timeouts, which can amplify load.']],
        ];
        if (isset($special[$code])) {
            [$defaults[1], $defaults[2]] = $special[$code];
        }

        return ['context' => $defaults[0], 'diagnosis' => $defaults[0], 'causes' => $defaults[1], 'solutions' => $defaults[2], 'example' => ['title' => 'Inspect the response', 'language' => 'shell', 'code' => 'curl -i https://example.com/resource', 'explanation' => "Inspect the status line and headers before deciding how to handle {$code} {$title}."]];
    }

    private function databaseGuidance(string $database, string $code, string $title): array
    {
        $locking = in_array($code, ['1205', '1213', '40001', '40P01'], true);
        $connection = $code === '2002';
        $diagnosis = $connection ? 'Test name resolution and TCP or socket connectivity from the application runtime, then compare host, port, socket path, and server logs.' : ($locking ? 'Inspect the failed transaction, active locks, transaction order, and server logs. Preserve the structured error code rather than matching translated message text.' : 'Record the structured error code and inspect the failing SQL, bound values, schema, and current database context.');

        return ['context' => "Use the structured {$database} error code to branch reliably; human-readable messages may vary.", 'diagnosis' => $diagnosis,
            'causes' => $connection ? ['The database service is stopped or not listening at the configured endpoint.', 'Container, DNS, port, socket, firewall, or TLS settings do not match.'] : ($locking ? ['Concurrent transactions acquired incompatible locks in conflicting order.', 'A long transaction held locks beyond the application timeout.'] : ["The SQL or schema state violates the condition represented by {$code} {$title}.", 'The application is connected to a different database, schema, or migration state than expected.']),
            'solutions' => $connection ? ['Verify service health and connect from the same runtime using the configured endpoint.', 'Correct the endpoint or network policy; never expose the database merely to fix container-to-container traffic.'] : ($locking ? ['Keep transactions short and acquire shared resources in a consistent order.', 'Retry rollback-safe transactions with bounded jitter; investigate repeated failures.'] : ['Reproduce with the same SQL and parameters, then correct the statement, data, or migration.', 'Add application validation where it improves feedback, while keeping the database constraint authoritative.']),
            'example' => ['title' => 'Capture the structured code', 'language' => 'php', 'code' => "catch (PDOException \$e) {\n    \$sqlState = \$e->errorInfo[0] ?? null;\n}", 'explanation' => 'Log a correlation ID and structured code without exposing credentials or sensitive query values.']];
    }

    private function smppGuidance(string $code, string $title): array
    {
        $bind = in_array($code, ['00000004', '00000005', '0000000D', '0000000E', '0000000F'], true);

        return ['context' => 'This is the SMPP standard command_status meaning; an SMSC vendor may add documented operational detail but must not redefine the standard value.',
            'diagnosis' => $bind ? 'Inspect the bind PDU, bind mode, session state, system_id, password handling, interface version, and SMSC bind logs.' : 'Capture the request and response PDU headers, correlate sequence_number, and validate field lengths and TON/NPI/address values against the SMPP session contract.',
            'causes' => $bind ? ['Bind credentials, mode, or session state do not match the SMSC account.', 'The SMSC account is disabled, restricted, or already has its allowed sessions.'] : ['A PDU field or session state violates the SMPP protocol requirements.', 'The SMSC could not process the command at that moment.'],
            'solutions' => $bind ? ['Verify account values through a secure channel and do not log the password.', 'Close stale sessions, use the permitted bind mode, and confirm any operator-specific restrictions separately.'] : ['Validate the encoded PDU and session state before resending.', 'For transient system or queue failures, use bounded retry/backoff and confirm the SMSC policy.'],
            'example' => ['title' => 'Canonical status forms', 'language' => null, 'code' => '0x'.$code.' = '.hexdec($code).' decimal', 'explanation' => "SignalRate normalizes both forms to {$code} for lookup."]];
    }

    private function phpGuidance(string $title): array
    {
        return ['context' => 'Read the exception message and first application-owned stack frame together; the class identifies the category, not the complete root cause.',
            'diagnosis' => 'Reproduce with the same PHP version and inputs, then inspect the first application frame, declared signature, and runtime value shown by a debugger or safe structured log.',
            'causes' => ["Application code triggered {$title} by violating the documented language/runtime contract.", 'A dependency or stale generated code supplied an unexpected value or call shape.'],
            'solutions' => ['Correct the call site or declared contract rather than suppressing the throwable.', 'Add a focused regression test and validate data at the system boundary where invalid input originates.'],
            'example' => ['title' => 'Keep the original throwable', 'language' => 'php', 'code' => "try {\n    runOperation();\n} catch (Throwable \$error) {\n    report(\$error);\n    throw \$error;\n}", 'explanation' => 'Preserve the class, message, previous exception, and stack trace in protected logs.']];
    }

    private function laravelGuidance(string $code, string $title): array
    {
        $checks = match ($code) {
            'route-not-defined' => ['Compare the route name with `php artisan route:list`.', 'Clear stale optimized route caches after deployments.'],
            'target-class-does-not-exist', 'class-not-found' => ['Check namespace, import, filename case, Composer PSR-4 mapping, and service bindings.', 'Regenerate the Composer autoloader and rebuild deployment artifacts.'],
            'mass-assignment' => ['Review the model fillable/guarded policy and the validated input array.', 'Allow only intended fields; do not disable protection globally as a shortcut.'],
            'csrf-token-mismatch' => ['Confirm the request uses the web middleware, session cookie, and current CSRF token.', 'Fix cookie domain, HTTPS, proxy, and session configuration; exempt only genuine non-browser webhooks.'],
            'application-key-missing' => ['Confirm APP_KEY is present and readable in the running environment.', 'Generate a key for a new environment; do not rotate a live key without a data/session migration plan.'],
            'view-not-found' => ['Check the dot-notation view name, filename case, and configured view paths.', 'Deploy the view and clear stale compiled views.'],
            'storage-permission-denied' => ['Check the runtime user and permissions for storage and bootstrap/cache.', 'Grant the least filesystem access needed to the runtime user.'],
            default => ['Read the exception class and first application frame.', 'Verify configuration and clear only the relevant stale cache.'],
        };

        return ['context' => 'The normalized concept groups a stable failure mode; the exact message and stack trace remain application-specific.', 'diagnosis' => $checks[0],
            'causes' => ["Laravel encountered {$title} while resolving the request or application dependency.", 'Configuration, cached metadata, deployed files, or application code do not agree.'],
            'solutions' => $checks,
            'example' => ['title' => 'Inspect application diagnostics', 'language' => 'shell', 'code' => "php artisan about\nphp artisan route:list", 'explanation' => 'Run only read-only diagnostic commands that are relevant to the failure, then inspect protected application logs.']];
    }

    private function relations(array $rows): void
    {
        foreach ($rows as [$familyA, $codeA, $familyB, $codeB, $type]) {
            $a = ErrorEntry::whereHas('family', fn ($q) => $q->where('key', $familyA))->where('normalized_code', $this->normalizer->code($familyA, $codeA))->firstOrFail();
            $b = ErrorEntry::whereHas('family', fn ($q) => $q->where('key', $familyB))->where('normalized_code', $this->normalizer->code($familyB, $codeB))->firstOrFail();
            DB::table('error_relations')->insertOrIgnore([['error_id' => $a->id, 'related_error_id' => $b->id, 'type' => $type], ['error_id' => $b->id, 'related_error_id' => $a->id, 'type' => $type]]);
        }
    }
}
