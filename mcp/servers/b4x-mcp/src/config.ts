import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "b4x",
  "displayName": "B4X",
  "version": "1.0.0",
  "extensions": [
    ".bas"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "sub",
      "pattern": "^\\s*Sub\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bas",
      "content": "Sub Main\n  Log(\"Hello\")\nEnd Sub\n"
    },
    {
      "path": "tests/run.bas",
      "content": "Sub Main\n  Log(\"Hello\")\nEnd Sub\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Sub Main\n  Log(\"Hello\")\nEnd Sub\n"
    }
  },
  "reference": "B4X syntax reference\n- Example: Sub Main\n- Comment: '\n- No CLI runner configured"
}
