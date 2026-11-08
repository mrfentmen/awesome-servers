import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "golo",
  "displayName": "Golo",
  "version": "1.0.0",
  "extensions": [
    ".golo"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.golo",
      "content": "module demo\n\nfunction add = |a, b| -> a + b\n"
    },
    {
      "path": "tests/run.golo",
      "content": "module demo\n\nfunction add = |a, b| -> a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name = |value| -> value + 1"
    }
  },
  "reference": "Golo syntax reference\n- Module: module demo\n- Function: function name = |value| -> value + 1\n- Struct: struct Name = { value }\n- Import: import java.util.ArrayList\n- Let: let value = 1\n- Conditional: if condition { ... } else { ... }\n- Comment: // line; /* block */\n- Run: golo run file.golo",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
