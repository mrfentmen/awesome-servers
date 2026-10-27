# incident-timeline-mcp

Incident Timeline turns local timestamped logs into a coarse operational summary: file and line counts, severity totals, timestamp coverage, and the largest observed time gap.

## Quick start

```bash
npm install
npm test
npm start
```

Use `summarize_incident_timeline` with a bounded project or log directory.

## Privacy and limits

Log messages, timestamps, IDs, paths, IP addresses, and filenames are suppressed. The parser recognizes a conservative timestamp shape and broad severity words. It is a triage aid, not a forensic report.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
