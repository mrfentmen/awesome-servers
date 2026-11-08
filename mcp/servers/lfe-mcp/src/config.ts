import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lfe",
  "displayName": "LFE",
  "version": "1.0.0",
  "extensions": [
    ".lfe"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(defun\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.lfe",
      "content": "(defun add (a b)\n  (+ a b))\n"
    },
    {
      "path": "tests/run.lfe",
      "content": "(defun add (a b)\n  (+ a b))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(defun add (a b)\n  (+ a b))\n"
    }
  },
  "reference": "LFE syntax reference\n- Example: (defun add (a b)"
}
