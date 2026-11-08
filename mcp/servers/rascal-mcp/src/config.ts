import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rascal",
  "displayName": "Rascal",
  "version": "1.0.0",
  "extensions": [
    ".rsc"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:public\\s+)?[A-Za-z_][A-Za-z0-9_<>\\[\\]]*\\s+([a-z][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "data",
      "pattern": "^\\s*data\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.rsc",
      "content": "module demo\n\npublic int add(int a, int b) = a + b;\n"
    },
    {
      "path": "tests/run.rsc",
      "content": "module demo\n\npublic int add(int a, int b) = a + b;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module name\n\npublic int value(int a) = a + 1;"
    }
  },
  "reference": "Rascal syntax reference\n- Module: module name\n- Function: public int value(int a) = a + 1;\n- Data: data Name = name(int value);\n- Import: import List;\n- Variable: int value = 1;\n- Comment: // line; /* block */\n- Run: rascal file.rsc",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
