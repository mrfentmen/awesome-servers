# AlQuran Cloud MCP

Quran text with translations and verse search from the AlQuran Cloud API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/alquran-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "alquran-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/alquran-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_surah` | One surah with Arabic and English text |
| `search_verses` | Search the English translation |

## Notes

Surah numbers run from 1 to 114. The English edition is Sahih International (en.asad is also available).

## Licence

MIT
