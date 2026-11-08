import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ecl",
  "displayName": "ECL",
  "version": "1.0.0",
  "extensions": [
    ".ecl",
    ".eclxml"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*EXPORT\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ecl",
      "content": "EXPORT Add(INTEGER a, INTEGER b) := a + b;\n"
    },
    {
      "path": "tests/run.ecl",
      "content": "EXPORT Add(INTEGER a, INTEGER b) := a + b;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "EXPORT Add(INTEGER a, INTEGER b) := a + b;\n"
    }
  },
  "reference": "ECL syntax reference\n- Example: EXPORT Add(INTEGER a, INTEGER b) := a + b;\n- Comment: //\n- Run: ecl {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
