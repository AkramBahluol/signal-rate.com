<?php

return ['paths' => ['api/*'], 'allowed_methods' => ['*'], 'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')], 'allowed_origins_patterns' => [], 'allowed_headers' => ['Content-Type', 'Accept', 'Origin', 'X-Requested-With'], 'exposed_headers' => [], 'max_age' => 3600, 'supports_credentials' => false];
