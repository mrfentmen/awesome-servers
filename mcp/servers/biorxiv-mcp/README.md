# bioRxiv MCP

bioRxiv preprints — what was posted on a given day, and the full record for one DOI. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/biorxiv-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "biorxiv-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/biorxiv-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `papers` | Preprints posted in a date range, with authors, category, DOI, version |
| `paper` | One preprint by DOI: authors, institution, category, dates, abstract |

## Example

```
bioRxiv 2024-01-01 to 2024-01-03 — 360 preprints, showing 1-30

1. KCNQ2/3 regulates efferent mediated slow excitation of vestibular afferents in mammals
   Sinha, A. K.; Lee, C.; Holt, J. C. · neuroscience · 2024-01-01 · v1
   doi: 10.1101/2023.12.30.573731
```

## Notes

Reads the public bioRxiv API. No key, no login.

bioRxiv has **no keyword search**. It returns everything posted in a date range,
so this server offers a date range and a cursor instead of pretending to search.
A week with no arguments is usually far too many papers to read; narrow the
dates.

The API caps a page at 100 records. `cursor` is the record offset: if 30 came
back, pass `30` to get the next 30.

`published` is `NA` until the paper appears in a journal.

## Licence

MIT
