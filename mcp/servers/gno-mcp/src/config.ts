import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gno",
  "displayName": "Gno",
  "version": "1.0.0",
  "extensions": [
    ".gno"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*var\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.gno",
      "content": "package demo\n\nfunc Add(a int, b int) int {\n  return a + b\n}\n"
    },
    {
      "path": "tests/run.gno",
      "content": "package test\n\nfunc Value() int {\n  return 2 + 2\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "func Name(value int) int {\n  return value + 1\n}"
    },
    "type": {
      "description": "type",
      "body": "type Name struct {\n  Value int\n}"
    },
    "package": {
      "description": "package",
      "body": "package name"
    }
  },
  "reference": "Gno syntax reference\n- Package: package name\n- Function: func Name(value int) int { return value + 1 }\n- Type: type Name struct { Value int }\n- Variable: var value int = 1\n- Import: import \"gno.land/p/demo\"\n- Conditional: if condition { ... }\n- Loop: for i := 0; i < 10; i++ { ... }\n- Comment: // line; /* block */\n- Run: gno run file.gno"
}
