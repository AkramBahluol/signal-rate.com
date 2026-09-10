#!/usr/bin/env python3
"""Offline, privacy-preserving reports for SignalRate's Nginx JSON logs."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import hmac
import json
import os
import re
import statistics
import sys
import time
from collections import Counter, defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

ACCESS_LOG = Path(os.environ.get("SIGNALRATE_TRAFFIC_LOG", "/var/log/nginx/signalrate-access.json.log"))
SECURITY_LOG = Path(os.environ.get("SIGNALRATE_SECURITY_LOG", "/var/log/nginx/signalrate-security.json.log"))
DEPLOYMENT_LOG = Path(os.environ.get("SIGNALRATE_DEPLOYMENT_LOG", "/var/log/signalrate/deployments.json.log"))
KEY_FILE = Path(os.environ.get("SIGNALRATE_TRAFFIC_HMAC_KEY_FILE", "/etc/signalrate/traffic-hmac.key"))
REQUEST_ID = re.compile(r"^sr_[a-f0-9]{32}$")


def parse_timestamp(value: str) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def log_files(path: Path) -> list[Path]:
    candidates = [candidate for candidate in path.parent.glob(f"{path.name}*") if candidate.is_file()]
    return sorted(candidates, key=lambda candidate: candidate.stat().st_mtime)


def open_log(path: Path):
    return gzip.open(path, "rt", encoding="utf-8", errors="replace") if path.suffix == ".gz" else path.open("r", encoding="utf-8", errors="replace")


def read_records(path: Path, since: datetime | None = None) -> list[dict]:
    records: list[dict] = []
    for candidate in log_files(path):
        try:
            with open_log(candidate) as stream:
                for line in stream:
                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    timestamp = parse_timestamp(record.get("timestamp", ""))
                    if timestamp is None or (since is not None and timestamp < since):
                        continue
                    record["_timestamp"] = timestamp
                    records.append(record)
        except (OSError, PermissionError):
            continue
    return records


def number(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def integer(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def percentile(values: list[float], percent: int) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, (len(ordered) * percent + 99) // 100 - 1))
    return ordered[index]


def privacy_id(client_ip: str, secret: bytes) -> str:
    digest = hmac.new(secret, client_ip.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"c_{digest[:12]}"


def load_secret() -> bytes | None:
    try:
        value = KEY_FILE.read_text(encoding="ascii").strip()
    except (OSError, PermissionError):
        return None
    return value.encode("ascii") if len(value) >= 32 else None


def attach_clients(records: list[dict], since: datetime | None) -> bool:
    secret = load_secret()
    if secret is None:
        return False
    security = {item.get("request_id"): item.get("client_ip", "") for item in read_records(SECURITY_LOG, since)}
    for record in records:
        client_ip = security.get(record.get("request_id"), "")
        record["client_id"] = privacy_id(client_ip, secret) if client_ip else ""
    return True


def print_counter(title: str, counter: Counter, limit: int = 12) -> None:
    print(f"\n{title}")
    if not counter:
        print("  unavailable")
        return
    for key, count in counter.most_common(limit):
        print(f"  {str(key or 'unavailable'):<40} {count:>8}")


def traffic_group(value: str) -> str:
    if value == "human_browser_heuristic":
        return "human_browser (heuristic)"
    if value in {"googlebot_claim_unverified", "bingbot_claim_unverified", "known_search_crawler_claim_unverified", "other_crawler"}:
        return "crawler claims"
    if value in {"codex_automation", "node_script", "curl", "headless_browser"}:
        return "automation"
    if value == "security_scanner":
        return "scanner"
    return "unknown"


def content_group(record: dict) -> str:
    if record.get("upstream_kind") == "static" or record.get("route_class") == "static_asset":
        return "static assets"
    if record.get("upstream_kind") == "backend_api" or record.get("route_class") == "api":
        return "APIs"
    if record.get("is_rsc") == "true":
        return "Next.js RSC"
    if "text/html" in record.get("response_content_type", ""):
        return "HTML"
    if record.get("route_class") in {"tool_page", "network_tool", "developer_tool", "calculator"}:
        return "dynamic tools"
    return "other"


def status_family(status: int) -> str:
    return f"{status // 100}xx" if 100 <= status <= 599 else "unknown"


def format_bytes(value: int) -> str:
    amount = float(value)
    for unit in ("B", "KiB", "MiB", "GiB"):
        if amount < 1024 or unit == "GiB":
            return f"{amount:.1f} {unit}"
        amount /= 1024
    return f"{amount:.1f} GiB"


def report(hours: int) -> int:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    records = read_records(ACCESS_LOG, since)
    clients_available = attach_clients(records, since)
    print(f"SignalRate traffic report — last {hours} hour(s)")
    print(f"Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    if not records:
        print("No structured request records are available for this interval.")
        return 0

    statuses = Counter(integer(item.get("status")) for item in records)
    times = [number(item.get("request_time_ms")) for item in records]
    timestamps = [item["_timestamp"] for item in records]
    observed_minutes = max(1.0, (max(timestamps) - min(timestamps)).total_seconds() / 60)
    response_bytes = sum(integer(item.get("response_bytes")) for item in records)

    print("\nOVERVIEW")
    print(f"  total requests:             {len(records)}")
    unique_clients = len({item.get("client_id") for item in records if item.get("client_id")})
    print(f"  estimated unique clients:  {unique_clients if clients_available else 'unavailable (run with protected-log access)'}")
    print(f"  requests/minute:           {len(records) / observed_minutes:.2f}")
    print(f"  response bytes:            {format_bytes(response_bytes)}")
    print_counter("STATUS DISTRIBUTION", statuses, 20)
    print_counter("STATUS FAMILIES", Counter(status_family(status) for status in statuses.elements()), 10)
    print_counter("TRAFFIC TYPE", Counter(traffic_group(item.get("traffic_class", "")) for item in records))
    print_counter("COUNTRIES", Counter(item.get("cf_country") or "unavailable/direct" for item in records), 20)
    print_counter("DEVICES", Counter(item.get("device_class") or "unknown" for item in records))
    print_counter("CLIENT FAMILIES", Counter(item.get("user_agent_family") or "unknown" for item in records), 20)
    print_counter("TOP ROUTES", Counter(item.get("uri_path") or "unknown" for item in records), 20)
    print_counter("ROUTE FAMILIES", Counter(item.get("route_class") or "unknown" for item in records), 20)
    print_counter("LOCALES", Counter(item.get("locale") or "unknown" for item in records), 20)
    print_counter("SEARCH CRAWLER CLAIMS (UNVERIFIED)", Counter(item.get("traffic_class") for item in records if traffic_group(item.get("traffic_class", "")) == "crawler claims"), 20)
    print_counter("STATIC VS DYNAMIC", Counter(content_group(item) for item in records))
    print_counter("CACHE METADATA", Counter(item.get("cf_cache_status") or "unavailable at origin" for item in records), 10)

    print("\nLATENCY (milliseconds)")
    print(f"  overall avg/p50/p90/p95/p99: {statistics.fmean(times):.1f} / {percentile(times, 50):.1f} / {percentile(times, 90):.1f} / {percentile(times, 95):.1f} / {percentile(times, 99):.1f}")
    for kind in ("frontend", "backend_api"):
        values = [number(item.get("upstream_response_time_ms")) for item in records if item.get("upstream_kind") == kind and item.get("upstream_response_time_ms") not in (None, "")]
        label = "frontend/gateway" if kind == "frontend" else "backend API/gateway"
        print(f"  {label} avg/p50/p95: {statistics.fmean(values):.1f} / {percentile(values, 50):.1f} / {percentile(values, 95):.1f}" if values else f"  {label}: unavailable")

    print("\nTOP SLOW REQUESTS")
    for item in sorted(records, key=lambda row: number(row.get("request_time_ms")), reverse=True)[:10]:
        print(f"  {item.get('request_id','-')}  {integer(item.get('status')):>3}  {number(item.get('request_time_ms')):>8.1f} ms  upstream {number(item.get('upstream_response_time_ms')):>8.1f} ms  {item.get('uri_path','-')}")

    errors = [item for item in records if integer(item.get("status")) >= 400]
    print_counter("TOP 404 PATHS", Counter(item.get("uri_path") for item in errors if integer(item.get("status")) == 404), 20)
    print_counter("TOP 4XX", Counter(f"{item.get('status')} {item.get('uri_path')}" for item in errors if 400 <= integer(item.get("status")) < 500), 20)
    print("\nRECENT 5XX")
    five_xx = [item for item in errors if integer(item.get("status")) >= 500]
    if not five_xx:
        print("  none")
    for item in five_xx[-30:]:
        print(f"  {item['timestamp']}  {item.get('request_id','-')}  {item.get('status')}  {item.get('uri_path','-')}  upstream={item.get('upstream_status') or '-'}")

    print("\nTOP CLIENTS (HMAC identifiers)")
    if not clients_available:
        print("  unavailable; use sudo so the short-retention security log and HMAC key can be read")
    else:
        grouped: dict[str, list[dict]] = defaultdict(list)
        for item in records:
            if item.get("client_id"):
                grouped[item["client_id"]].append(item)
        for client_id, items in sorted(grouped.items(), key=lambda pair: len(pair[1]), reverse=True)[:15]:
            classes = Counter(traffic_group(item.get("traffic_class", "")) for item in items)
            paths = Counter(item.get("uri_path") for item in items)
            print(f"  {client_id}  requests={len(items)}  classification={classes.most_common(1)[0][0]}  top_path={paths.most_common(1)[0][0]}")

    deployments = read_records(DEPLOYMENT_LOG, since)
    print("\nDEPLOYMENT EVENTS")
    if not deployments:
        print("  none in interval")
    for item in deployments[-20:]:
        print(f"  {item.get('timestamp')}  {item.get('deployment_id')}  {item.get('event')}  {item.get('status') or '-'}  commit={item.get('commit') or '-'}")
    return 0


def find_request(request_id: str) -> dict | None:
    for item in reversed(read_records(ACCESS_LOG)):
        if item.get("request_id") == request_id:
            return item
    return None


def trace(request_id: str) -> int:
    if not REQUEST_ID.fullmatch(request_id):
        print("Invalid request ID; expected sr_ followed by 32 lowercase hexadecimal characters.", file=sys.stderr)
        return 2
    item = find_request(request_id)
    if item is None:
        print(f"Request ID not found in retained structured logs: {request_id}", file=sys.stderr)
        return 1

    end = item["_timestamp"]
    total = number(item.get("request_time_ms"))
    connect = number(item.get("upstream_connect_time_ms"))
    header = number(item.get("upstream_header_time_ms"))
    upstream = number(item.get("upstream_response_time_ms"))
    start = end - timedelta(milliseconds=total)

    print(f"Request ID: {request_id}")
    print("Stages are derived only from the response timestamp and Nginx-measured durations.")
    print(f"{start.isoformat(timespec='milliseconds')}  Host Nginx accepted request")
    if item.get("upstream_addr"):
        print(f"{start.isoformat(timespec='milliseconds')}  Routed to {item.get('upstream_kind')} {item.get('upstream_addr')}")
        print(f"{(start + timedelta(milliseconds=connect)).isoformat(timespec='milliseconds')}  Upstream connection established")
        print(f"{(start + timedelta(milliseconds=header)).isoformat(timespec='milliseconds')}  First upstream byte")
    print(f"{end.isoformat(timespec='milliseconds')}  Response completed")
    print(f"\nHTTP: {item.get('status')} {item.get('method')} {item.get('uri_path')}")
    print(f"Total: {total:.1f} ms")
    print(f"Upstream: {upstream:.1f} ms")
    print(f"Country: {item.get('cf_country') or 'unavailable/direct'}")
    print(f"Cloudflare Ray: {item.get('cf_ray') or 'unavailable/direct'}")
    print(f"Route class: {item.get('route_class') or 'unknown'}")
    print(f"Traffic class: {item.get('traffic_class') or 'unknown'}")

    for event in read_records(DEPLOYMENT_LOG):
        started = parse_timestamp(event.get("started_at", ""))
        completed = parse_timestamp(event.get("completed_at", event.get("timestamp", ""))) if event.get("event") == "completed" else None
        if started and completed and started <= start <= completed:
            print(f"Deployment correlation: {event.get('deployment_id')} ({event.get('status')}) commit={event.get('commit')}")
    return 0


def safe_live_line(item: dict) -> str:
    timestamp = parse_timestamp(item.get("timestamp", ""))
    clock = timestamp.strftime("%H:%M:%S") if timestamp else "--:--:--"
    return f"{clock}  {integer(item.get('status')):>3}  {number(item.get('request_time_ms')):>7.1f}ms  {(item.get('cf_country') or '--'):<2}  {(item.get('traffic_class') or 'unknown'):<34}  {item.get('uri_path') or '-'}  {item.get('request_id') or '-'}"


def live(lines: int, follow: bool, seconds: int) -> int:
    if not ACCESS_LOG.exists():
        print(f"Structured access log does not exist: {ACCESS_LOG}", file=sys.stderr)
        return 1
    with ACCESS_LOG.open("r", encoding="utf-8", errors="replace") as stream:
        recent = deque(stream, maxlen=lines)
        for line in recent:
            try:
                print(safe_live_line(json.loads(line)))
            except json.JSONDecodeError:
                continue
        if not follow:
            return 0
        deadline = time.monotonic() + seconds if seconds > 0 else None
        while deadline is None or time.monotonic() < deadline:
            line = stream.readline()
            if not line:
                time.sleep(0.2)
                continue
            try:
                print(safe_live_line(json.loads(line)), flush=True)
            except json.JSONDecodeError:
                continue
    return 0


def main(argv: list[str] | None = None) -> int:
    invoked = Path(sys.argv[0]).name
    arguments = list(sys.argv[1:] if argv is None else argv)
    if invoked == "signalrate-traffic-report":
        arguments.insert(0, "report")
    elif invoked == "signalrate-trace-request":
        arguments.insert(0, "trace")
    elif invoked == "signalrate-traffic-live":
        arguments.insert(0, "live")

    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    report_parser = subparsers.add_parser("report")
    report_parser.add_argument("--hours", type=int, choices=range(1, 169), default=24, metavar="1-168")
    trace_parser = subparsers.add_parser("trace")
    trace_parser.add_argument("request_id")
    live_parser = subparsers.add_parser("live")
    live_parser.add_argument("--lines", type=int, default=20)
    live_parser.add_argument("--no-follow", action="store_true")
    live_parser.add_argument("--seconds", type=int, default=0, help="stop following after this many seconds; 0 follows until interrupted")
    options = parser.parse_args(arguments)
    if options.command == "report":
        return report(options.hours)
    if options.command == "trace":
        return trace(options.request_id)
    return live(max(1, min(options.lines, 200)), not options.no_follow, max(0, options.seconds))


if __name__ == "__main__":
    raise SystemExit(main())
