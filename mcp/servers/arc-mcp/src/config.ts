import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "arc",
  "displayName": "Arc",
  "version": "1.0.0",
  "extensions": [
    ".arc"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(def\\s+([A-Za-z_][\\w-]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.arc",
      "content": "(def add (a b)\n  (+ a b))\n"
    },
    {
      "path": "tests/run.arc",
      "content": "(def add (a b)\n  (+ a b))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(def add (a b)\n  (+ a b))\n"
    }
  },
  "reference": "Arc syntax reference\n- Example: (def add (a b)\n- Comment: ;\n- No CLI runner configured"
}
