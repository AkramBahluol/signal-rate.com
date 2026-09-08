#!/bin/sh
set -eu

php artisan optimize

if [ "$#" -gt 0 ]; then
    exec "$@"
fi

exec php-fpm -F
