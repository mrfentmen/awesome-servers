#!/usr/bin/env python3
"""Live smoke check for neverbounce-mcp.

Skips honestly when no key is configured - never pretends to have checked.
With a key, hits /account/info (no credits burned) and prints the balance.
"""
import json
import os
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("NEVERBOUNCE_API_KEY", "").strip()
if not KEY:
    print("SKIP: NEVERBOUNCE_API_KEY is not set; nothing live to check.")
    sys.exit(0)

body = json.dumps({"key": KEY}).encode()
req = urllib.request.Request(
    "https://api.neverbounce.com/v4.2/account/info",
    data=body,
    headers={"content-type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
except urllib.error.HTTPError as err:
    print(f"FAIL: HTTP {err.code} from neverbounce: {err.read()[:300]!r}")
    sys.exit(1)
except Exception as err:  # noqa: BLE001
    print(f"FAIL: {err}")
    sys.exit(1)

if data.get("status") != "success":
    print(f"FAIL: neverbounce said status={data.get('status')}: {data.get('message')}")
    sys.exit(1)

print(f"OK: account reachable, credits={data.get('credits')}")
