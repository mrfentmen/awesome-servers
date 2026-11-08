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

| `show_target_prerequisites` | Show a target's prerequisites. |
| `show_phony_targets` | List .PHONY targets. |
| `show_default_goal` | Show the default target. |
| `show_variable` | Show one expanded make variable. |
| `check_up_to_date` | Check a target with make -q. |
| `run_with_keep_going` | Run make with -k. |
| `run_with_always_make` | Run make with -B. |
| `run_quiet` | Run make with -s. |

## Safety

This server executes the local `make` command. Treat Makefiles and targets as trusted input.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
