import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "clarion",
  "displayName": "Clarion",
  "version": "1.0.0",
  "extensions": [
    ".clw"
  ],
  "markers": [],
  "comment": "!",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "program",
      "pattern": "^\\s*(PROGRAM|MODULE|PROCEDURE)\\s*$"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.clw",
      "content": "PROGRAM\n  MAP\n  END\n  CODE\n  RETURN\n"
    },
    {
      "path": "tests/run.clw",
      "content": "PROGRAM\n  MAP\n  END\n  CODE\n  RETURN\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "PROGRAM\n  MAP\n  END\n  CODE\n  RETURN\n"
    }
  },
  "reference": "Clarion syntax reference\n- Example: PROGRAM\n- Comment: !\n- Run: clarion {file}"
}
