# arXiv MCP

arXiv: 2.4M+ preprints — search, fetch by id, browse authors, latest per category — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/arxiv-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "arxiv-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/arxiv-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_papers` | Relevance or date search; field prefixes (`ti:`, `au:`, `cat:`) pass through |
| `paper_by_id` | One paper with its full abstract |
| `papers_by_author` | Papers attributed to an author, newest first |
| `latest_in_category` | Newest submissions in one category |
| `search_in_category` | Topic search restricted to a category |

## Example

```
1. Attention Is All You Need
   Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit +4 more · 2017-06-12 · cs.CL, cs.LG
   arXiv:1706.03762 · https://arxiv.org/pdf/1706.03762v7
```

## Notes

Uses export.arxiv.org's Atom API and parses the entry format directly. The arXiv
API rate-limits bursts; tools are read-only and capped at 25 results per call.

## Licence

MIT
