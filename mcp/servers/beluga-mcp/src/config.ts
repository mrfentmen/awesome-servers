import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "beluga",
  "displayName": "Beluga",
  "version": "1.0.0",
  "extensions": [
    ".bel"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "type",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*:\\s*type"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bel",
      "content": "demo : type.\nadd : demo -> demo -> demo.\n"
    },
    {
      "path": "tests/run.bel",
      "content": "demo : type.\nadd : demo -> demo -> demo.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "demo : type.\nadd : demo -> demo -> demo.\n"
    }
  },
  "reference": "Beluga syntax reference\n- Example: demo : type."
}
