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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `profile_incident_samples`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
