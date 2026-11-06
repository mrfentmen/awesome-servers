# research-mcp

Market research without an API key. stdio MCP over Python 3.9+, stdlib only
(pytrends optional). Data sources are all public and keyless:

1. DuckDuckGo autocomplete → real human query-space ("demand breadth")
2. Bing / Mojeek `site:etsy.com` result counts → competition proxy
   ("saturation"); `None` means both engines refused and it says so — never
   a fake zero
3. Google Trends via pytrends → 12-month interest trajectory (optional:
   `pip install pytrends`)

Never touches eRank quotas, never scrapes Etsy listing pages.

## Tools

- `market_check` — organic niche snapshot for a keyword: suggest breadth +
  approximate Etsy saturation with the engine each count came from
- `trend` — 12-month Google Trends trajectory (recent/half-halves/slope)
- `suggest` — DuckDuckGo autocomplete query-space for a seed

## Run

```bash
npx -y @mrfentmen/research-mcp
# or directly:
python3 src/research_mcp.py
```

## Configuration

- `MARKET_RESEARCH_CACHE` — results cache file (JSON). Default
  `~/.cache/market-research/cache.json`. Counts are cached across runs to
  stay polite; calls sleep ~3s between variants.

MCP client config:

```json
{
  "research": {
    "type": "local",
    "command": ["npx", "-y", "@mrfentmen/research-mcp"]
  }
}
```
