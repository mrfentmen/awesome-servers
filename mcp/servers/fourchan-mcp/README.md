# fourchan mcp

MCP server for **4chan**, board catalogs, threads, and posts from the raw archive of internet culture.

## Tools

| Tool | What it does |
|---|---|
| `list_boards` | All boards, split into SFW / NSFW |
| `get_catalog` | Live threads for a board, sorted by reply count |
| `get_thread` | Read a thread's posts |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
get_catalog { board: "g", limit: 10 }
get_thread { board: "g", threadNo: 109460960 }
```

Keyless (the official read only JSON API at a.4cdn.org). Post HTML is flattened to readable text; image filenames are included.
