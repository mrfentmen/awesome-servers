import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nemerle",
  "displayName": "Nemerle",
  "version": "1.0.0",
  "extensions": [
    ".n"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:def|mutable)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|module|interface|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.n",
      "content": "def add(a : int, b : int) : int { a + b }\n"
    },
    {
      "path": "tests/run.n",
      "content": "def add(a : int, b : int) : int { a + b }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def value(a : int) : int { a + 1 }"
    }
  },
  "reference": "Nemerle syntax reference\n- Function: def value(a : int) : int { a + 1 }\n- Class: class Name { ... }\n- Module: module Name { ... }\n- Using: using System\n- Mutable: mutable value = 1\n- Conditional: if (condition) { ... } else { ... }\n- Comment: // line; /* block */\n- Run: ncc file.n",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
