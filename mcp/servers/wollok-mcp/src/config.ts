import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "wollok",
  "displayName": "Wollok",
  "version": "1.0.0",
  "extensions": [
    ".wlk"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "object",
      "pattern": "^\\s*object\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*method\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.wlk",
      "content": "object demo {\n  method add(a, b) { return a + b }\n}\n"
    },
    {
      "path": "tests/run.wlk",
      "content": "object demo {\n  method add(a, b) { return a + b }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "object name {\n  method value() { return 1 }\n}"
    }
  },
  "reference": "Wollok syntax reference\n- Object: object name { ... }\n- Class: class Name { ... }\n- Method: method value() { return 1 }\n- Import: import wollok.game.*\n- Variable: var value = 1\n- Conditional: if (condition) { ... }\n- Comment: // line; /* block */\n- Run: wollok file.wlk",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
