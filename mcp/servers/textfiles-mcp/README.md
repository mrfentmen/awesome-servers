# textfiles mcp

MCP server for **textfiles.com**, the definitive archive of BBS era text files: 1980s/90s zines, phreaking docs, hacker culture, and early net history.

## Tools

| Tool | What it does |
|---|---|
| `list_topics` | Topic sections (adventure, anarchy, hacking, phreak, magazines, music…) |
| `list_files` | Files + subdirectories inside a section |
| `read_file` | Read a text file (latin-1 decoded, it predates UTF-8) |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
list_topics {}
list_files { dir: "hacking" }
read_file { path: "hacking/22.txt" }
```

No API, the site is a static tree with its own HTML tables, parsed directly. Read the same DDN bulletins, phreak docs, and underground zines that shaped the early internet.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_topics`: List the topic sections of textfiles.com (art, etext, hacking,
- `list_files`: List the files in a textfiles.com directory.
- `read_file`: Read a text file from the archive (1980s/90s zines, docs, and net culture).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `list_topics`.


