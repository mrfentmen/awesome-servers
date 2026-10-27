# Spaceflight News MCP

Spaceflight News API v4: 36k+ space articles, full-text search, outlet filter, agency reports — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y spaceflight-news-api-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "spaceflight-news-api-mcp": {
      "command": "npx",
      "args": ["-y", "spaceflight-news-api-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `latest_news` | Newest articles across every outlet |
| `search_news` | Full-text search over all articles |
| `news_by_site` | Articles from one outlet |
| `article_detail` | One article with summary and image |
| `latest_reports` | Space agency reports |
| `latest_blogs` | Newest blog posts |
| `news_sources` | Every tracked outlet |

## Example

```
Latest spaceflight news (2 of 36,659 articles):

1. West Coast Falcon 9 rocket to launch 27 Starlink satellites
   Spaceflight Now · 2026-10-27 00:50 · Steven Young
   https://spaceflightnow.com/2026/10/27/west-coast-falcon-9-rocket-to-launch-27-starlink-satellites/
```

## Notes

The API is free and needs no key. It throttles bursts, so this server retries a 429 twice before reporting it.

## Licence

MIT
