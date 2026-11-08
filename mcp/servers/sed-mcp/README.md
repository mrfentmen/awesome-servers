# Sed MCP

sed is a missing stream-editor language in the MCP ecosystem. This server exposes real sed transformations.

Keyless. No API key. No signup. Requires the built-in `sed` command.

## Install

```bash
npx -y @mrfentmen/sed-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "sed-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/sed-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `run_script` | Run an arbitrary sed script. |
| `run_script_file` | Run a sed script file. |
| `check_script` | Parse a sed script. |
| `substitute` | Regex replace with literal replacement text. |
| `delete_lines` | Delete lines by sed address. |
| `print_lines` | Print lines by sed address. |
| `extract_range` | Print an inclusive line range. |
| `replace_line` | Replace one line by number. |
| `count_matches` | Count matching lines. |
| `strip_blank_lines` | Remove blank lines. |
| `transform_file` | Write a transformed copy of a file. |
| `print_version` | Show the local sed version. |

| `insert_line` | Insert one line before a line number. |
| `append_line` | Append one line after a line number. |
| `translate_chars` | Translate characters with sed y. |
| `number_lines` | Print 1-based line numbers. |
| `normalize_whitespace` | Collapse and trim whitespace. |
| `remove_comments` | Delete comment lines. |
| `join_lines` | Join lines with a separator. |
| `delete_range` | Delete an inclusive line range. |

## Safety

This server executes the local `sed` command. Treat scripts as trusted input. `transform_file` refuses to overwrite its input path.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
