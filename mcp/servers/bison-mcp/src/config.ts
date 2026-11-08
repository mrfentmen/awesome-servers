import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bison",
  "displayName": "Bison",
  "version": "1.0.0",
  "extensions": [
    ".y",
    ".bison"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "rule",
      "pattern": "^([a-z][A-Za-z0-9_]*)\\s*:"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.y",
      "content": "%token NUMBER\n%%\nexpr: NUMBER ;\n%%\n"
    },
    {
      "path": "tests/run.y",
      "content": "%token NUMBER\n%%\nexpr: NUMBER ;\n%%\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%token NUMBER\n%%\nexpr: NUMBER ;\n%%\n"
    }
  },
  "reference": "Bison syntax reference\n- Example: %token NUMBER\n- Comment: //\n- Run: bison {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
