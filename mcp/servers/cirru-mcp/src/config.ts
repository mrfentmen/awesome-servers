import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cirru",
  "displayName": "Cirru",
  "version": "1.0.0",
  "extensions": [
    ".cirru"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][\\w-]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.cirru",
      "content": "def add (a b)\n  + a b\n"
    },
    {
      "path": "tests/run.cirru",
      "content": "def add (a b)\n  + a b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add (a b)\n  + a b\n"
    }
  },
  "reference": "Cirru syntax reference\n- Example: def add (a b)\n- Comment: ;\n- No CLI runner configured"
}
