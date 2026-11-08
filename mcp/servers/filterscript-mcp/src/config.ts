import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "filterscript",
  "displayName": "Filterscript",
  "version": "1.0.0",
  "extensions": [
    ".fs"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:int|void|float|string)\\s+([A-Za-z_]\\w*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.fs",
      "content": "int add(int a, int b) { return a + b; }\n"
    },
    {
      "path": "tests/run.fs",
      "content": "int add(int a, int b) { return a + b; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int add(int a, int b) { return a + b; }\n"
    }
  },
  "reference": "Filterscript syntax reference\n- Example: int add(int a, int b) { return a + b; }\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
