import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "twelf",
  "displayName": "Twelf",
  "version": "1.0.0",
  "extensions": [
    ".elf"
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
      "path": "src/demo.elf",
      "content": "demo : type.\nadd : demo -> demo -> demo.\n"
    },
    {
      "path": "tests/run.elf",
      "content": "demo : type.\nadd : demo -> demo -> demo.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "demo : type.\nadd : demo -> demo -> demo.\n"
    }
  },
  "reference": "Twelf syntax reference\n- Example: demo : type."
}
