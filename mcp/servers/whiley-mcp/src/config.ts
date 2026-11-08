import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "whiley",
  "displayName": "Whiley",
  "version": "1.0.0",
  "extensions": [
    ".whiley"
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
    },
    {
      "kind": "method",
      "pattern": "^\\s*method\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.whiley",
      "content": "function add(int a, int b) -> int:\n    return a + b\n"
    },
    {
      "path": "tests/run.whiley",
      "content": "function add(int a, int b) -> int:\n    return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function value(int a) -> int:\n    return a + 1"
    }
  },
  "reference": "Whiley syntax reference\n- Function: function value(int a) -> int: return a + 1\n- Method: method value(int a) -> int: return a\n- Type: type Name is int\n- Import: import std::io\n- Variable: int value = 1\n- Conditional: if condition: ...\n- Loop: while condition: ...\n- Comment: // line; /* block */\n- Run: wy file.whiley",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
