#!/usr/bin/env bash
set -Eeuo pipefail

realip_destination="${1:-/etc/nginx/snippets/cloudflare-realip.conf}"
geo_destination="${2:-/etc/nginx/snippets/cloudflare-trusted-geo.conf}"
realip_temporary="$(mktemp)"
geo_temporary="$(mktemp)"
trap 'rm -f "$realip_temporary" "$geo_temporary"' EXIT

{
    printf '# Generated from Cloudflare published IP ranges.\n'
} > "$realip_temporary"
{
    printf '# Generated from Cloudflare published IP ranges.\n'
} > "$geo_temporary"

for endpoint in https://www.cloudflare.com/ips-v4 https://www.cloudflare.com/ips-v6; do
    while IFS= read -r cidr; do
        [[ "$cidr" =~ ^[0-9a-fA-F:./]+$ ]] || exit 1
        printf 'set_real_ip_from %s;\n' "$cidr" >> "$realip_temporary"
        printf '%s 1;\n' "$cidr" >> "$geo_temporary"
    done < <(curl --fail --silent --show-error "$endpoint")
done

{
    printf 'real_ip_header CF-Connecting-IP;\n'
    printf 'real_ip_recursive on;\n'
} >> "$realip_temporary"

grep -q '^set_real_ip_from ' "$realip_temporary"
grep -q '^real_ip_header CF-Connecting-IP;' "$realip_temporary"
grep -qE '^[0-9a-fA-F:./]+ 1;$' "$geo_temporary"
install -o root -g root -m 0644 "$realip_temporary" "$realip_destination"
install -o root -g root -m 0644 "$geo_temporary" "$geo_destination"
nginx -t
systemctl reload nginx
