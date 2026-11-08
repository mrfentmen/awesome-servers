import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "koka",
  "displayName": "Koka",
  "version": "1.0.0",
  "extensions": [
    ".kk"
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
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:type|alias)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "effect",
      "pattern": "^\\s*effect\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.kk",
      "content": "module demo\n\nfun add(a : int, b : int) : int\n  a + b\n\nfun main()\n  println(add(2, 2))\n"
    },
    {
      "path": "tests/run.kk",
      "content": "fun main()\n  if 2 + 2 != 4 then throw(\"math failed\")\n  println(\"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun name(value : int) : int\n  value + 1"
    },
    "module": {
      "description": "module",
      "body": "module name"
    },
    "effect": {
      "description": "effect",
      "body": "effect name\n  fun operation() : int"
    }
  },
  "reference": "Koka syntax reference\n- Module: module name\n- Function: fun name(value : int) : int value + 1\n- Type: type name = int\n- Effect: effect name ...\n- Variable: val name = 1\n- Conditional: if condition then ... else ...\n- Loop: foreach(1..10) fn(i) ...\n- Import: import module\n- Comment: // line; /* block */\n- Compile: koka file.kk"
}
