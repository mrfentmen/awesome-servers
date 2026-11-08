import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "emberscript",
  "displayName": "EmberScript",
  "version": "1.0.0",
  "extensions": [
    ".em",
    ".emberscript"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^([A-Za-z_]\\w*)\\s*="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.em",
      "content": "add = (a, b) -> a + b\n"
    },
    {
      "path": "tests/run.em",
      "content": "add = (a, b) -> a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "add = (a, b) -> a + b\n"
    }
  },
  "reference": "EmberScript syntax reference\n- Example: add = (a, b) -> a + b\n- Comment: #\n- Run: emberscript {file}"
}
