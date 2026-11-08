import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "roc",
  "displayName": "Roc",
  "version": "1.0.0",
  "extensions": [
    ".roc"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*(?:app|module|interface|package)\\s+\\[([A-Za-z_][A-Za-z0-9_]*)\\]"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*="
    },
    {
      "kind": "type",
      "pattern": "^\\s*([A-Z][A-Za-z0-9_]*)\\s*:"
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
      "path": "src/demo.roc",
      "content": "module [add]\n\nadd = \\a, b -> a + b\n"
    },
    {
      "path": "tests/run.roc",
      "content": "module [value]\n\nvalue = 2 + 2\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "name = \\value -> value + 1"
    },
    "module": {
      "description": "module",
      "body": "module [name]"
    },
    "record": {
      "description": "record",
      "body": "value = { name: \"Roc\" }"
    }
  },
  "reference": "Roc syntax reference\n- Module: module [name]\n- App: app [main] { ... }\n- Function: name = \\value -> value + 1\n- Type: Name : [Value]\n- Record: { name: \"Roc\" }\n- List: [1, 2, 3]\n- Conditional: if condition then value else other\n- Import: import Module\n- Comment: # line\n- Run: roc run file.roc"
}
