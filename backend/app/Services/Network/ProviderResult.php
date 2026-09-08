<?php

namespace App\Services\Network;

final readonly class ProviderResult
{
    public function __construct(
        public string $status,
        public string $provider,
        public ?string $source,
        public array $data = [],
        public ?string $error = null,
        public ?string $retrievedAt = null,
    ) {}

    public static function unavailable(string $provider, ?string $source = null, string $reason = 'Provider is not configured.'): self
    {
        return new self('unavailable', $provider, $source, [], $reason, now()->toIso8601String());
    }

    public static function failed(string $provider, ?string $source, string $reason): self
    {
        return new self('error', $provider, $source, [], $reason, now()->toIso8601String());
    }

    public static function success(string $provider, ?string $source, array $data): self
    {
        return new self('success', $provider, $source, $data, null, now()->toIso8601String());
    }

    public function toArray(): array
    {
        return ['status' => $this->status, 'provider' => $this->provider, 'source' => $this->source, 'retrieved_at' => $this->retrievedAt, 'data' => $this->data, 'error' => $this->error];
    }
}
