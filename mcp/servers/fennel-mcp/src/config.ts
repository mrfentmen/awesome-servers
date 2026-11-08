import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fennel",
  "displayName": "Fennel",
  "version": "1.0.0",
  "extensions": [
    ".fnl"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(fn\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*\\(macro\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "local",
      "pattern": "^\\s*\\(local\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "require",
      "pattern": "\\(require\\s+:([A-Za-z_][A-Za-z0-9_.-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.fnl",
      "content": "(fn add [a b]\n  (+ a b))\n"
    },
    {
      "path": "tests/run.fnl",
      "content": "(fn add [a b]\n  (+ a b))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(fn value [a]\n  (+ a 1))"
    }
  },
  "reference": "Fennel syntax reference\n- Function: (fn value [a] (+ a 1))\n- Macro: (macro name [a] ...)\n- Local: (local value 1)\n- Require: (require :module)\n- Conditional: (if condition then else)\n- Loop: (each [i value (ipairs values)] ...)\n- Comment: ; line\n- Run: fennel file.fnl"
}
