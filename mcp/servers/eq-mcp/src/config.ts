import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "eq",
  "displayName": "EQ",
  "version": "1.0.0",
  "extensions": [
    ".eq"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^([A-Za-z_]\\w*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.eq",
      "content": "add(a, b) = a + b\n"
    },
    {
      "path": "tests/run.eq",
      "content": "add(a, b) = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "add(a, b) = a + b\n"
    }
  },
  "reference": "EQ syntax reference\n- Example: add(a, b) = a + b\n- Comment: //\n- No CLI runner configured"
}
