# nasa-images-mcp

NASA image and video library: media search, asset files with originals, center filters, keyword summaries.

Data source: https://images-api.nasa.gov (public API, no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_media` | Search images, video and audio by keyword. |
| `item_detail` | Full record for one NASA ID. |
| `asset_files` | Every file for an asset, including full-resolution originals. |
| `by_center` | Images published by a NASA center code. |
| `recent_media` | Media added since a given year. |
| `keyword_summary` | Keyword, center and media-type tallies across results. |

## Install

```bash
npx -y nasa-images-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "nasa-images-mcp": { "command": "npx", "args": ["-y", "nasa-images-mcp"] }
  }
}
```

## Example prompts

- find apollo 11 photos
- give me a full resolution mars image

## Notes

Responses are plain text, trimmed to the fields that matter. Errors come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
