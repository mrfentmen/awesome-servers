import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "chuck",
  "displayName": "ChucK",
  "version": "1.0.0",
  "extensions": [
    ".ck"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+(?:int|float|void|string)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*Machine\\.add\\s*\\(\\s*\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ck",
      "content": "fun int add(int a, int b) { return a + b; }\n"
    },
    {
      "path": "tests/run.ck",
      "content": "fun int add(int a, int b) { return a + b; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun int value(int a) { return a + 1; }"
    }
  },
  "reference": "ChucK syntax reference\n- Function: fun int value(int a) { return a + 1; }\n- Class: class Name { ... }\n- Variable: int value;\n- Conditional: if (condition) { ... }\n- Loop: while (condition) { ... }\n- Time: 1::second => now;\n- Comment: // line; /* block */\n- Run: chuck file.ck",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
