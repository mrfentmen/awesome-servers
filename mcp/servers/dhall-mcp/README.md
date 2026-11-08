# Dhall MCP

Dhall had no dedicated MCP in the checked catalogs. This server gives agents 20 real tools instead of a stub.

Requires `dhall` for execution. The source, lint, symbol and scaffold tools work without it.

## Install

```bash
npx -y @mrfentmen/dhall-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "dhall-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/dhall-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `detect_project` | Find language files, project markers and layout in a directory. |
| `read_source` | Read a source file or a line range. |
| `write_source` | Write a source file, with overwrite protection. |
| `syntax_check` | Check brackets, strings and comments; run the parser when configured. |
| `format_source` | Trim whitespace, normalize line endings and add a final newline. |
| `lint_source` | Find trailing whitespace, tabs, long lines and unbalanced structure. |
| `extract_symbols` | List functions, classes, types and other definitions. |
| `list_imports` | List imports, includes and dependencies. |
| `list_todos` | Find TODO, FIXME, HACK and XXX comments. |
| `find_references` | Find every mention of a symbol in one file. |
| `rename_symbol` | Rename a symbol in one file, with a dry-run default. |
| `insert_snippet` | Insert a language-specific starter snippet. |
| `comment_lines` | Comment a line range using the language marker. |
| `uncomment_lines` | Remove the comment marker from a line range. |
| `scaffold_project` | Create a small runnable starter project. |
| `run_source` | Run a file with the installed interpreter or compiler. |
| `run_tests` | Run the configured test command. |
| `build_project` | Build a project with the configured compiler command. |
| `toolchain_status` | Show which local compilers and tools are installed. |
| `language_reference` | Return a compact syntax and toolchain reference. |

## Safety

This server reads and writes local source files and runs local compiler commands. Treat project files and commands as trusted input.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
