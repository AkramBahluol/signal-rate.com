<?php

return [
    'directory_rate_limit' => (int) env('DIRECTORY_RATE_LIMIT_PER_MINUTE', 60),
    'internal_directory_rate_limit' => (int) env('INTERNAL_DIRECTORY_RATE_LIMIT_PER_MINUTE', 3000),
];
