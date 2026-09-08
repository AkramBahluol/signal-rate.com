# SignalRate launch checklist

## Domain and edge

- [ ] Purchase/control `signal-rate.com`; create Cloudflare apex and `www` DNS records.
- [ ] Enable proxying and Full (strict) TLS; provision a valid origin certificate or tunnel.
- [ ] Verify HTTP→HTTPS and `www`→apex redirects preserve paths and queries.
- [ ] Restrict origin access and configure trusted proxies exactly as in `PRODUCTION_DEPLOYMENT.md`.

## Ubuntu host

- [ ] Apply updates, install Docker/Compose, configure key-only SSH and firewall.
- [ ] Configure off-host monitoring, Docker log rotation, disk alerts, and automatic security updates appropriate to the environment.
- [ ] Create encrypted off-host PostgreSQL backups and complete a test restore.

## Release

- [ ] Check out the reviewed release commit; create `.env.production` from the example with no secrets in Git.
- [ ] Set `APP_ENV=production`, `APP_DEBUG=false`, URLs, APP_KEY, database password, Redis host, contact address, and trusted proxies.
- [ ] Leave AdSense and analytics disabled until their separate review is complete.
- [ ] Run production Compose config/build, start dependencies, migrate with `--force`, and run reviewed reference imports only.
- [ ] Start all services; confirm all health checks and resource use on the 4 GB host.

## Public smoke test

- [ ] Verify homepage, search, every directory family, representative tools/errors/telecom pages, and legal/trust pages.
- [ ] Confirm missing entities return 404, validation errors return 4xx, and production responses expose no stack traces.
- [ ] Verify security headers, canonical host, robots, sitemap, and no localhost metadata.
- [ ] Run `node scripts/audit-site.mjs` against the production origin and resolve broken links/indexable thin pages.
- [ ] Test homepage/tool/error/country/MCC/carrier/network/developer/mobile-plan templates at narrow and wide viewports with keyboard navigation.

## Discovery and later monetization

- [ ] Add Search Console Domain property and submit the sitemap using `SEARCH_CONSOLE_SETUP.md`.
- [ ] Review Privacy/Terms with qualified counsel for the actual launch regions.
- [ ] Enable privacy-reviewed analytics only if needed, without tool inputs or lookup targets.
- [ ] Consider AdSense only after the content/site review in `ADSENSE_READINESS.md`; use a certified CMP where required and a real environment-supplied ads.txt record.
