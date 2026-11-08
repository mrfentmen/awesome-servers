import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "apollo-guidance-computer",
  "displayName": "Apollo Guidance Computer",
  "version": "1.0.0",
  "extensions": [
    ".agc"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "constant",
      "pattern": "^\\s*([A-Z][A-Z0-9_]*)\\s+EQU"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.agc",
      "content": "# AGC assembly\nCOUNT EQU 3\n"
    },
    {
      "path": "tests/run.agc",
      "content": "# AGC assembly\nCOUNT EQU 3\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "# AGC assembly\nCOUNT EQU 3\n"
    }
  },
  "reference": "Apollo Guidance Computer syntax reference\n- Example: # AGC assembly\n- Comment: #\n- No CLI runner configured"
}
