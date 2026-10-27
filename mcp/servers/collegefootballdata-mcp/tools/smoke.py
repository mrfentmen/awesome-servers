#!/usr/bin/env python3
"""Live smoke check for collegefootballdata-mcp.

Skips honestly when no key is configured - never pretends to have checked.
With a key, fetches the season calendar for a recent season.
"""
import json
import os
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("COLLEGEFOOTBALLDATA_API_KEY", "").strip()
if not KEY:
    print("SKIP: COLLEGEFOOTBALLDATA_API_KEY is not set; nothing live to check.")
    sys.exit(0)

url = f"https://api.collegefootballdata.com/calendar?year=2025&authorization={KEY}"
try:
    with urllib.request.urlopen(urllib.request.Request(url, headers={"accept": "application/json"}), timeout=30) as resp:
        data = json.load(resp)
except urllib.error.HTTPError as err:
    print(f"FAIL: HTTP {err.code} from CFBD: {err.read()[:300]!r}")
    sys.exit(1)
except Exception as err:  # noqa: BLE001
    print(f"FAIL: {err}")
    sys.exit(1)

weeks = [row.get("week") for row in (data if isinstance(data, list) else [])]
print(f"OK: CFBD reachable, {len(weeks)} calendar weeks returned (first: {weeks[0] if weeks else 'n/a'})")
