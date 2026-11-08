import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "glyph",
  "displayName": "Glyph",
  "version": "1.0.0",
  "extensions": [
    ".glf"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.glf",
      "content": "def add(a, b) {\n  a + b\n}\n"
    },
    {
      "path": "tests/run.glf",
      "content": "def add(a, b) {\n  a + b\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b) {\n  a + b\n}\n"
    }
  },
  "reference": "Glyph syntax reference\n- Example: def add(a, b) {\n- Comment: //\n- No CLI runner configured"
}
