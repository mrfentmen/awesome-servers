#!/usr/bin/env python3
"""Live smoke check for docraptor-mcp.

Skips honestly when no key is configured - never pretends to have checked.
With a key, renders a tiny TEST-mode PDF (test documents are free per
DocRaptor's docs) and checks it is a real PDF.
"""
import base64
import os
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("DOCRAPTOR_API_KEY", "").strip()
if not KEY:
    print("SKIP: DOCRAPTOR_API_KEY is not set; nothing live to check.")
    sys.exit(0)

body = base64.b64encode(
    (
        '{"type": "pdf", "name": "awesome-servers smoke", "test": true, '
        '"document_content": "<p>awesome-servers docraptor-mcp smoke test</p>"}'
    ).encode()
).decode()
req = urllib.request.Request(
    "https://api.docraptor.com/docs",
    data=base64.b64decode(body),
    headers={"content-type": "application/json", "authorization": "Basic " + base64.b64encode(f"{KEY}:".encode()).decode()},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
except urllib.error.HTTPError as err:
    print(f"FAIL: HTTP {err.code} from docraptor: {err.read()[:300]!r}")
    sys.exit(1)
except Exception as err:  # noqa: BLE001
    print(f"FAIL: {err}")
    sys.exit(1)

if not data.startswith(b"%PDF"):
    print(f"FAIL: response does not look like a PDF ({data[:8]!r})")
    sys.exit(1)

print(f"OK: test PDF rendered, {len(data)} bytes")
