# M4 MCP

M4 is a missing macro language in the MCP ecosystem. This server exposes real preprocessing tools.

Keyless. No API key. No signup. Requires the built-in `m4` command.

## Install

```bash
npx -y @mrfentmen/m4-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "m4-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/m4-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `expand` | Preprocess M4 input. |
| `expand_file` | Preprocess an M4 file. |
| `check_syntax` | Run preprocessing and report errors. |
| `list_macros` | List built-in macros. |
| `dump_macro` | Dump one macro definition. |
| `trace_macro` | Trace calls to one macro. |
| `define` | Preprocess with one extra definition. |
| `undefine` | Preprocess after undefining a macro. |
| `include_file` | Preprocess a file with include paths. |
| `prefix_all` | Prefix built-in macros with m4_. |
| `print_version` | Show the local M4 version. |

## Safety

This server executes the local `m4` command. Treat scripts and targets as trusted input. `transform_file` refuses to overwrite its input path.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
