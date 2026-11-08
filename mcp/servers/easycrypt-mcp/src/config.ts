import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "easycrypt",
  "displayName": "EasyCrypt",
  "version": "1.0.0",
  "extensions": [
    ".ec"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "operator",
      "pattern": "^\\s*op\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ec",
      "content": "op add (a b : int) = a + b.\n"
    },
    {
      "path": "tests/run.ec",
      "content": "op add (a b : int) = a + b.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "op add (a b : int) = a + b.\n"
    }
  },
  "reference": "EasyCrypt syntax reference\n- Example: op add (a b : int) = a + b.\n- Comment: //\n- Run: easycrypt {file}",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
