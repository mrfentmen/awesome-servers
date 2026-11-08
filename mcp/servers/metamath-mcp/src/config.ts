import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "metamath",
  "displayName": "Metamath",
  "version": "1.0.0",
  "extensions": [
    ".mm"
  ],
  "markers": [],
  "comment": "$(",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "constant",
      "pattern": "^\\$c\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.mm",
      "content": "$c demo $.\n$p demo $= $.\n"
    },
    {
      "path": "tests/run.mm",
      "content": "$c demo $.\n$p demo $= $.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "$c demo $.\n$p demo $= $.\n"
    }
  },
  "reference": "Metamath syntax reference\n- Example: $c demo $.",
  "blockComment": {
    "start": "$(",
    "end": "$)"
  }
}
