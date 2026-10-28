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
