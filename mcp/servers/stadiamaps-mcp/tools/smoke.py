#!/usr/bin/env python3
"""Live smoke check for stadiamaps-mcp.

Skips honestly when no key is configured - never pretends to have checked.
With a key, reverse-geocodes a known point and prints what came back.
"""
import json
import os
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("STADIA_MAPS_API_KEY", "").strip()
if not KEY:
    print("SKIP: STADIA_MAPS_API_KEY is not set; nothing live to check.")
    sys.exit(0)

url = (
    "https://api.stadiamaps.com/geocoding/v1/reverse"
    "?point.lat=37.7749&point.lon=-122.4194&api_key=" + KEY
)
try:
    with urllib.request.urlopen(urllib.request.Request(url, headers={"accept": "application/json"}), timeout=30) as resp:
        data = json.load(resp)
except urllib.error.HTTPError as err:
    print(f"FAIL: HTTP {err.code} from Stadia Maps: {err.read()[:300]!r}")
    sys.exit(1)
except Exception as err:  # noqa: BLE001
    print(f"FAIL: {err}")
    sys.exit(1)

features = data.get("features", []) if isinstance(data, dict) else []
first = features[0].get("properties", {}).get("label") if features else None
print(f"OK: reverse geocoding answered, {len(features)} feature(s), first: {first}")
