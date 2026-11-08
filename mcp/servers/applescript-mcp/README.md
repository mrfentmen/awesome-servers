# AppleScript MCP

AppleScript is a missing language in the MCP ecosystem. This server gives agents real macOS automation tools instead of a stub.

Keyless. No API key. No signup. Requires macOS and the built-in `osascript`, `osacompile`, `sdef`, `open`, and `pbcopy` tools.

## Install

```bash
npx -y @mrfentmen/applescript-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "applescript-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/applescript-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `run_script` | Run an AppleScript string. |
| `run_script_file` | Run a `.scpt` or `.applescript` file with argv values. |
| `check_syntax` | Compile without running. |
| `compile_script` | Compile a string to a `.scpt` file. |
| `run_handler` | Call one named handler from a script. |
| `list_running_apps` | List visible foreground apps. |
| `get_app_info` | Check running, frontmost and visible state. |
| `get_app_dictionary` | Read an app's AppleScript dictionary with `sdef`. |
| `tell_app` | Send a raw command inside a `tell application` block. |
| `display_dialog` | Show a dialog and return the chosen button. |
| `display_notification` | Show a macOS notification. |
| `get_clipboard` | Read plain text from the clipboard. |
| `set_clipboard` | Replace the clipboard with plain text. |
| `open_app` | Open an app by name. |
| `quit_app` | Ask an app to quit. |
| `system_info` | Return the macOS system info record. |

## Safety

These tools can run arbitrary AppleScript and control applications. Use them with trusted input only. `run_script`, `run_script_file`, `tell_app`, and `run_handler` are intentionally powerful.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
