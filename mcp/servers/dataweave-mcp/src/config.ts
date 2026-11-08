import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dataweave",
  "displayName": "DataWeave",
  "version": "1.0.0",
  "extensions": [
    ".dwl"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.dwl",
      "content": "fun add(a: Number, b: Number): Number = a + b\n"
    },
    {
      "path": "tests/run.dwl",
      "content": "fun add(a: Number, b: Number): Number = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun add(a: Number, b: Number): Number = a + b\n"
    }
  },
  "reference": "DataWeave syntax reference\n- Example: fun add(a: Number, b: Number): Number = a + b\n- Comment: //\n- Run: dw {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
