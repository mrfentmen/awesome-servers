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
