#!/usr/bin/env bash
set -Eeuo pipefail

destination="${1:-/etc/nginx/snippets/cloudflare-realip.conf}"
temporary_file="$(mktemp)"
trap 'rm -f "$temporary_file"' EXIT

{
    printf '# Generated from Cloudflare published IP ranges.\n'
    curl --fail --silent --show-error https://www.cloudflare.com/ips-v4 | while IFS= read -r cidr; do
        [[ "$cidr" =~ ^[0-9./]+$ ]] || exit 1
        printf 'set_real_ip_from %s;\n' "$cidr"
    done
    curl --fail --silent --show-error https://www.cloudflare.com/ips-v6 | while IFS= read -r cidr; do
        [[ "$cidr" =~ ^[0-9a-fA-F:/]+$ ]] || exit 1
        printf 'set_real_ip_from %s;\n' "$cidr"
    done
    printf 'real_ip_header CF-Connecting-IP;\n'
    printf 'real_ip_recursive on;\n'
} > "$temporary_file"

grep -q '^set_real_ip_from ' "$temporary_file"
grep -q '^real_ip_header CF-Connecting-IP;' "$temporary_file"
install -o root -g root -m 0644 "$temporary_file" "$destination"
nginx -t
systemctl reload nginx
