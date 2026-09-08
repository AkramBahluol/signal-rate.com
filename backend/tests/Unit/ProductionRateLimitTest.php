<?php

namespace Tests\Unit;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

final class ProductionRateLimitTest extends TestCase
{
    public function test_directory_limiter_separates_public_and_internal_frontend_traffic(): void
    {
        config()->set('signalrate.directory_rate_limit', 60);
        config()->set('signalrate.internal_directory_rate_limit', 3000);
        $limiter = RateLimiter::limiter('directory');

        $publicRequest = Request::create('/api/v1/countries', 'GET', server: ['REMOTE_ADDR' => '203.0.113.10']);
        $internalRequest = Request::create('/api/v1/countries', 'GET', server: [
            'REMOTE_ADDR' => '172.30.0.4',
            'HTTP_X_SIGNALRATE_INTERNAL' => 'frontend',
        ]);

        self::assertSame(60, $limiter($publicRequest)->maxAttempts);
        self::assertSame('203.0.113.10', $limiter($publicRequest)->key);
        self::assertSame(3000, $limiter($internalRequest)->maxAttempts);
        self::assertSame('internal-frontend', $limiter($internalRequest)->key);
    }
}
