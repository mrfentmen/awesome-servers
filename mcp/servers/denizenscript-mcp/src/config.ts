import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "denizenscript",
  "displayName": "DenizenScript",
  "version": "1.0.0",
  "extensions": [
    ".dsc"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "key",
      "pattern": "^([A-Za-z0-9_]+):"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.dsc",
      "content": "demo:\n  type: task\n  script:\n  - narrate \"hello\"\n"
    },
    {
      "path": "tests/run.dsc",
      "content": "demo:\n  type: task\n  script:\n  - narrate \"hello\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "demo:\n  type: task\n  script:\n  - narrate \"hello\"\n"
    }
  },
  "reference": "DenizenScript syntax reference\n- Example: demo:\n- Comment: #\n- No CLI runner configured"
}
