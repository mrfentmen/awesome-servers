import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "shen",
  "displayName": "Shen",
  "version": "1.0.0",
  "extensions": [
    ".shen"
  ],
  "markers": [],
  "comment": "\\\\",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(define\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.shen",
      "content": "(define add\n  A B -> (+ A B))\n"
    },
    {
      "path": "tests/run.shen",
      "content": "(define add\n  A B -> (+ A B))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(define add\n  A B -> (+ A B))\n"
    }
  },
  "reference": "Shen syntax reference\n- Example: (define add"
}
