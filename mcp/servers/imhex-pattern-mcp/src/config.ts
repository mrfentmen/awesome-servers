import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "imhex-pattern",
  "displayName": "ImHex Pattern Language",
  "version": "1.0.0",
  "extensions": [
    ".hexpat"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.hexpat",
      "content": "struct Person {\n  char name[32];\n};\n"
    },
    {
      "path": "tests/run.hexpat",
      "content": "struct Person {\n  char name[32];\n};\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "struct Person {\n  char name[32];\n};\n"
    }
  },
  "reference": "ImHex Pattern Language syntax reference\n- Example: struct Person {\n- Comment: //\n- Run: imhex {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
