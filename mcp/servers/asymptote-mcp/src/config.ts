import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "asymptote",
  "displayName": "Asymptote",
  "version": "1.0.0",
  "extensions": [
    ".asy"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:int|real|void|string|bool)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
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
      "path": "src/demo.asy",
      "content": "int add(int a, int b) { return a + b; }\n"
    },
    {
      "path": "tests/run.asy",
      "content": "int add(int a, int b) { return a + b; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int value(int a) { return a + 1; }"
    }
  },
  "reference": "Asymptote syntax reference\n- Function: int value(int a) { return a + 1; }\n- Struct: struct Name { int value; }\n- Import: import graph;\n- Variable: int value = 1;\n- Conditional: if (condition) { ... }\n- Loop: for (int i = 0; i < 10; ++i) { ... }\n- Comment: // line; /* block */\n- Run: asy file.asy",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
