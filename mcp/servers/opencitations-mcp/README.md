# OpenCitations MCP

Who cites a DOI, and what it cites — open citation links from the OpenCitations Index. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/opencitations-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "opencitations-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/opencitations-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `citations` | Works that cite a DOI |
| `references` | Works that a DOI cites |
| `counts` | How many works cite it, and how many it cites |

## Example

```
Citations of 10.1038/nature12373 — 1806 links

   2025-05-01  10.1063/5.0251893
   2025-04-10  10.1021/acsanm.5c00276
   2025-07-07  10.1002/adom.202501050
   ... 1803 more (raise limit to see them)
```

```
10.1038/nature12373

Cited by: 1806 works
References: 30 works
```

## Notes

Reads the public OpenCitations Index (`opencitations.net/index/api/v1`). No key,
no login.

DOIs can be passed bare or as a `doi.org` URL, and `doi:` prefixes are stripped.

The link endpoints return every link at once — one Nature paper has 1,806 citing
works and roughly 460 KB of JSON. Output is capped at `limit` lines (default 25,
max 100) and the remainder is reported, so nothing is silently hidden.

An unknown DOI answers 200 with an empty list, which is reported as "no links
recorded" rather than an error.

`counts` uses the API's own citation-count and reference-count endpoints, not a
count of the rows this server printed.

## Licence

MIT
