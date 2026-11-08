import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ceylon",
  "displayName": "Ceylon",
  "version": "1.0.0",
  "extensions": [
    ".ceylon"
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
      "kind": "class",
      "pattern": "^\\s*(?:shared\\s+)?(?:class|interface|object)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:shared\\s+)?[A-Z][A-Za-z0-9_]*(?:<[^>]+>)?\\s+([a-z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*(?:=>|\\{)"
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
      "path": "src/demo.ceylon",
      "content": "shared Integer add(Integer a, Integer b) => a + b;\n"
    },
    {
      "path": "tests/run.ceylon",
      "content": "shared Integer add(Integer a, Integer b) => a + b;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "shared Integer name(Integer value) => value + 1;"
    }
  },
  "reference": "Ceylon syntax reference\n- Function: shared Integer name(Integer value) => value + 1;\n- Class: shared class Name() { ... }\n- Interface: shared interface Name { ... }\n- Object: shared object name { ... }\n- Import: import ceylon.collection { ArrayList }\n- Value: value name = 1;\n- Comment: // line; /* block */\n- Run: ceylon run demo",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
