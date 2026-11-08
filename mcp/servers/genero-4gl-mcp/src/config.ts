import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "genero-4gl",
  "displayName": "Genero 4gl",
  "version": "1.0.0",
  "extensions": [
    ".4gl"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "program",
      "pattern": "^\\s*(MAIN)\\s*$"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.4gl",
      "content": "MAIN\n  DISPLAY \"Hello\"\nEND MAIN\n"
    },
    {
      "path": "tests/run.4gl",
      "content": "MAIN\n  DISPLAY \"Hello\"\nEND MAIN\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MAIN\n  DISPLAY \"Hello\"\nEND MAIN\n"
    }
  },
  "reference": "Genero 4gl syntax reference\n- Example: MAIN\n- Comment: #\n- Run: fglcomp {file}"
}
