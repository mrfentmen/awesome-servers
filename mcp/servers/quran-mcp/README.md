# Al Quran Cloud

Quran text and translations: read a surah, one ayah by reference, the chapter list and available editions - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/quran-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "quran-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/quran-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_surahs` | The 114 chapters with Arabic and English names. |
| `get_surah` | Read one surah in an edition (Arabic or a translation). |
| `get_ayah` | One verse by reference, e.g. 2:255. |
| `list_editions` | Editions available for a language, with format and script. |

## Data source

Al Quran Cloud API (alquran.cloud)
