import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "reasonligo",
  "displayName": "ReasonLIGO",
  "version": "1.0.0",
  "extensions": [
    ".religo"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([a-z][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "open",
      "pattern": "^\\s*open\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.religo",
      "content": "let add = (a: int, b: int): int => a + b;\n"
    },
    {
      "path": "tests/run.religo",
      "content": "let add = (a: int, b: int): int => a + b;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let value = (a: int): int => a + 1;"
    }
  },
  "reference": "ReasonLIGO syntax reference\n- Function: let value = (a: int): int => a + 1;\n- Type: type name = int;\n- Module: module Name = { ... };\n- Open: open List;\n- Variable: let value: int = 1;\n- Comment: // line; /* block */\n- Compile: ligo compile file.religo",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
