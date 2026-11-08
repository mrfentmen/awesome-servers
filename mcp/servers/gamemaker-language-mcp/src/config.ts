import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gamemaker-language",
  "displayName": "Game Maker Language",
  "version": "1.0.0",
  "extensions": [
    ".gml"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gml",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.gml",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a, b) {\n  return a + b;\n}\n"
    }
  },
  "reference": "Game Maker Language syntax reference\n- Example: function add(a, b) {\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
