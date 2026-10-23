#!/usr/bin/env python3
"""Live smoke check for ipdata-mcp.

Skips honestly when no key is configured - never pretends to have checked.
With a key, looks up one public IP and prints what ipdata actually answered.
"""
import json
import os
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("IPDATA_API_KEY", "").strip()
if not KEY:
    print("SKIP: IPDATA_API_KEY is not set; nothing live to check.")
    sys.exit(0)

url = f"https://api.ipdata.co/8.8.8.8?api-key={KEY}"
req = urllib.request.Request(url, headers={"accept": "application/json"})
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
except urllib.error.HTTPError as err:
    print(f"FAIL: HTTP {err.code} from ipdata: {err.read()[:300]!r}")
    sys.exit(1)
except Exception as err:  # noqa: BLE001
    print(f"FAIL: {err}")
    sys.exit(1)

threat = data.get("threat", {})
print(
    "OK: "
    f"{data.get('ip')} -> {data.get('city')}, {data.get('country_name')} "
    f"(asn {data.get('asn', {}).get('asn')}, tor={threat.get('is_tor')}, "
    f"proxy={threat.get('is_proxy')})"
)
