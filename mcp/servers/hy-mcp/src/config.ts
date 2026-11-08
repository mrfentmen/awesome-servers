import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hy",
  "displayName": "Hy",
  "version": "1.0.0",
  "extensions": [
    ".hy"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(defn\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*\\(defmacro\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*\\(defclass\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*\\(setv\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*\\(import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.hy",
      "content": "(defn add [a b]\n  (+ a b))\n"
    },
    {
      "path": "tests/run.hy",
      "content": "(defn add [a b]\n  (+ a b))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(defn name [value]\n  (+ value 1))"
    }
  },
  "reference": "Hy syntax reference\n- Function: (defn name [value] (+ value 1))\n- Macro: (defmacro name [value] ...)\n- Class: (defclass Name [] ...)\n- Variable: (setv value 1)\n- Import: (import math)\n- Conditional: (if condition then else)\n- Loop: (for [i (range 10)] ...)\n- Comment: ; line\n- Run: hy file.hy"
}
