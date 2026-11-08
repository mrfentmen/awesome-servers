import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "frege",
  "displayName": "Frege",
  "version": "1.0.0",
  "extensions": [
    ".fr"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][A-Za-z0-9_']*)\\s+[a-z]"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.fr",
      "content": "add a b = a + b\n"
    },
    {
      "path": "tests/run.fr",
      "content": "add a b = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "add a b = a + b\n"
    }
  },
  "reference": "Frege syntax reference\n- Example: add a b = a + b"
}
