# analysis-mcp

Offline security-artifact analysis for assessment work. Pure text
transformation on bytes you already have — no network access, no scope
surface, no third-party Python dependencies. Python 3.9+.

## Tools

- `extract_endpoints` — mine a JS/TS bundle for API paths, external hosts,
  object identifiers and hardcoded secrets (credentialed findings are
  redacted by default)
- `diff_responses` — diff two HTTP responses; the artifact that proves
  BOLA/IDOR (cross-identity mode interprets it for you)
- `jwt_decode` — decode a JWT and triage algorithm, expiry and claims.
  Decoding does NOT prove validity.
- `parse_burp` — hosts, methods and notable requests from a Burp XML export
- `corpus_search`, `corpus_topics` — search a local reference corpus
  (OWASP CheatSheetSeries, WSTG, PayloadsAllTheThings) by concept and get
  narrow passages with file:line — never whole documents

## Run

```bash
npx -y @mrfentmen/analysis-mcp
# or directly:
python3 src/analysis_mcp.py
```

## Configuration

- `CORPUS_DIR` — where your reference corpus lives. Point it at a checkout
  of OWASP/CheatSheetSeries, OWASP/wstg and swisskyrepo/PayloadsAllTheThings
  (the corpus_search prompt tells you when it is missing).

MCP client config:

```json
{
  "analysis": {
    "type": "local",
    "command": ["npx", "-y", "@mrfentmen/analysis-mcp"],
    "environment": { "CORPUS_DIR": "/path/to/references" }
  }
}
```
