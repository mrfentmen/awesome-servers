import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "baml",
  "displayName": "BAML",
  "version": "1.0.0",
  "extensions": [
    ".baml"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.baml",
      "content": "class Resume {\n  name string\n}\n"
    },
    {
      "path": "tests/run.baml",
      "content": "class Resume {\n  name string\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Resume {\n  name string\n}\n"
    }
  },
  "reference": "BAML syntax reference\n- Example: class Resume {\n- Comment: //\n- No CLI runner configured"
}
