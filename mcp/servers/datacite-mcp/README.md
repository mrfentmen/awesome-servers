# DataCite MCP

Search DataCite DOIs and read their metadata — datasets, software, preprints, samples and other research outputs. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/datacite-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "datacite-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/datacite-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | DOIs matching a query, with creators, publisher, year and type |
| `doi` | One record: title, creators, publisher, type, URL, citation and download counts, abstract |

## Example

```
"electrolyser" — 631027 DOIs

1. Keynote: Early-Stage Operating Experience with a 3 MW PEM Electrolyser
   Wallner, Christian · NEFI New Energy for Industry · 2026 · Presentation
   doi: 10.5281/zenodo.24002992
```

## Notes

Reads the public DataCite REST API. No key, no login.

DOIs are passed straight through, and `https://doi.org/...` URLs are trimmed
for you.

`search` accepts DataCite's query syntax as well as plain words, for example
`creators.name:"Smith"` or `resourceTypeGeneral:Dataset`.

The abstract is stripped of HTML tags before it is returned.

## Licence

MIT
