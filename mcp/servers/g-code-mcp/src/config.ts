import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "g-code",
  "displayName": "G-code",
  "version": "1.0.0",
  "extensions": [
    ".g",
    ".cnc",
    ".gco",
    ".gcode"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "command",
      "pattern": "^(G\\d+)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.g",
      "content": "G21\nG90\nG1 X10 Y10 F100\n"
    },
    {
      "path": "tests/run.g",
      "content": "G21\nG90\nG1 X10 Y10 F100\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "G21\nG90\nG1 X10 Y10 F100\n"
    }
  },
  "reference": "G-code syntax reference\n- Example: G21\n- Comment: ;\n- No CLI runner configured"
}
