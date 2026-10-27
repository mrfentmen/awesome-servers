# gopher mcp

An MCP server that speaks the **Gopher protocol**, the pre HTTP internet, still running since 1991.

Gopher is a text menu protocol: you open a menu, it lists typed items (directories, text files, search services), and you navigate deeper. This server is a raw TCP Gopher client (port 70), no HTTP, no scraping.

## Why it's original

Nobody else has a Gopher client as an MCP tool. The AI can now surf gopherspace, Floodgap, SDF, Veronica search, and read documents that predate the web.

## Tools

| Tool | What it does |
|---|---|
| `open_menu` | Open a gopher menu and list its items (dirs, text, search, binaries) |
| `read_textfile` | Read a plain text file (gopher type 0) |
| `search_veronica` | Run a Veronica-2 search across gopherspace |

## Usage

```bash
npm run build && node dist/index.js
```

Example flow:

```
open_menu { host: "gopher.floodgap.com", selector: "/" }
search_veronica { host: "gopher.floodgap.com", query: "retro games" }
read_textfile { host: "gopher.floodgap.com", selector: "/0/floodgap/new" }
```

Default host is `gopher.floodgap.com` (Floodgap Systems, serving gopher since 1999, blocklist updated April 2026, ~81,000 Veronica matches indexed). All keyless, no auth.
