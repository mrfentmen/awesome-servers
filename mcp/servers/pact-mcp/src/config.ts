import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pact",
  "displayName": "Pact",
  "version": "1.0.0",
  "extensions": [
    ".pact"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*\\(module\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*\\(defun\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "capability",
      "pattern": "^\\s*\\(defcap\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "schema",
      "pattern": "^\\s*\\(defschema\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*\\(use\\s+([A-Za-z_][A-Za-z0-9_.-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.pact",
      "content": "(module demo GOV\n  (defun add (a:integer b:integer)\n    (+ a b)))\n"
    },
    {
      "path": "tests/run.pact",
      "content": "(module test GOV\n  (defun value ()\n    (+ 2 2)))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(defun name (value:integer)\n  (+ value 1))"
    },
    "schema": {
      "description": "schema",
      "body": "(defschema name\n  value:integer)"
    },
    "module": {
      "description": "module",
      "body": "(module name GOV\n  (defcap GOV () true))"
    }
  },
  "reference": "Pact syntax reference\n- Module: (module name GOV ...)\n- Function: (defun name (value:integer) (+ value 1))\n- Capability: (defcap GOV () true)\n- Schema: (defschema name value:integer)\n- Constant: (defconst NAME 1)\n- Use: (use module)\n- Comment: ; line\n- Run: pact file.pact"
}
