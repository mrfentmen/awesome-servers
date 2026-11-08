import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "souffle",
  "displayName": "Souffle",
  "version": "1.0.0",
  "extensions": [
    ".dl"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "relation",
      "pattern": "^\\s*\\.decl\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*\\.type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*\\.include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.dl",
      "content": ".decl add(a: number, b: number)\nadd(a, b) :- a = 1, b = 2.\n"
    },
    {
      "path": "tests/run.dl",
      "content": ".decl add(a: number, b: number)\nadd(a, b) :- a = 1, b = 2.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ".decl value(a: number)\nvalue(a) :- a = 1."
    }
  },
  "reference": "Souffle syntax reference\n- Relation: .decl value(a: number)\n- Rule: value(a) :- a = 1.\n- Type: .type Name = number\n- Include: .include \"file.dl\"\n- Output: .output value\n- Comment: // line; /* block */\n- Run: souffle file.dl",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
