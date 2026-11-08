import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "eff",
  "displayName": "Eff",
  "version": "1.0.0",
  "extensions": [
    ".eff"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.eff",
      "content": "let add a b = a + b\n"
    },
    {
      "path": "tests/run.eff",
      "content": "let add a b = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let add a b = a + b\n"
    }
  },
  "reference": "Eff syntax reference\n- Example: let add a b = a + b"
}
