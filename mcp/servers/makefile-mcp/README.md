# Makefile MCP

Make is a missing build language in the MCP ecosystem. This server reads Makefiles and runs real make targets.

Keyless. No API key. No signup. Requires the built-in `make` command.

## Install

```bash
npx -y @mrfentmen/makefile-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "makefile-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/makefile-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_targets` | List target names. |
| `show_target_recipe` | Show one target's recipe lines. |
| `show_variables` | Show variable assignments. |
| `list_makefiles` | Find Makefile and *.mk files. |
| `dry_run` | Show what a target would do with make -n. |
| `run_target` | Run one make target. |
| `run_default` | Run the default target. |
| `run_jobs` | Run with a parallel job count. |
| `check_makefile` | Parse a Makefile and report syntax errors. |
| `show_database` | Print make's internal database. |
| `show_include_files` | List include directives. |
| `print_version` | Show the local GNU Make version. |

## Safety

This server executes the local `makefile` command. Treat scripts and targets as trusted input. `transform_file` refuses to overwrite its input path.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
