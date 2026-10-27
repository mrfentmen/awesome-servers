# dockerhub-mcp

Docker Hub images: search, details, tags with sizes and digests, official image ranking, tag manifests.

Data source: https://hub.docker.com (public API, no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_images` | Keyword search across Docker Hub with pull and star counts. |
| `image_details` | Description, popularity and status for one repository. |
| `image_tags` | Tag list with size, architectures and update dates. |
| `tag_info` | Per-architecture digests and sizes for a single tag. |
| `official_images` | Official images ranked by pull count. |
| `compare_images` | Side-by-side stars, pulls and status for two images. |

## Install

```bash
npx -y @mrfentmen/dockerhub-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "dockerhub-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dockerhub-mcp"] }
  }
}
```

## Example prompts

- which nginx tag is smallest
- compare postgres and mysql popularity

## Notes

Responses are plain text, trimmed to the fields that matter. Errors come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
