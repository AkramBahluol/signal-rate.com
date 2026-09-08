<?php

namespace App\Providers;

use App\Services\Network\Contracts\AsnProvider;
use App\Services\Network\Contracts\DnsResolver;
use App\Services\Network\Contracts\GeoIpProvider;
use App\Services\Network\Contracts\HttpProbe;
use App\Services\Network\Contracts\RdapProvider;
use App\Services\Network\Contracts\ReverseDnsResolver;
use App\Services\Network\Providers\CurlHttpProbe;
use App\Services\Network\Providers\IanaRdapProvider;
use App\Services\Network\Providers\NativeDnsResolver;
use App\Services\Network\Providers\NativeReverseDnsResolver;
use App\Services\Network\Providers\UnavailableAsnProvider;
use App\Services\Network\Providers\UnavailableGeoIpProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(GeoIpProvider::class, UnavailableGeoIpProvider::class);
        $this->app->bind(AsnProvider::class, UnavailableAsnProvider::class);
        $this->app->bind(RdapProvider::class, IanaRdapProvider::class);
        $this->app->bind(ReverseDnsResolver::class, NativeReverseDnsResolver::class);
        $this->app->bind(DnsResolver::class, NativeDnsResolver::class);
        $this->app->bind(HttpProbe::class, CurlHttpProbe::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('directory', function (Request $request): Limit {
            // The private Nginx gateway overwrites this header from the fixed
            // frontend container address. The backend has no published port.
            $internalFrontend = $request->header('X-SignalRate-Internal') === 'frontend';
            $limit = $internalFrontend
                ? max(1, (int) config('signalrate.internal_directory_rate_limit', 3000))
                : max(1, (int) config('signalrate.directory_rate_limit', 60));
            $key = $internalFrontend ? 'internal-frontend' : $request->ip();

            return Limit::perMinute($limit)->by((string) $key);
        });
    }
}
