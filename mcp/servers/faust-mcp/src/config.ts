import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "faust",
  "displayName": "Faust",
  "version": "1.0.0",
  "extensions": [
    ".dsp"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^([A-Za-z_]\\w*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.dsp",
      "content": "add(a, b) = a + b;\nprocess = add;\n"
    },
    {
      "path": "tests/run.dsp",
      "content": "add(a, b) = a + b;\nprocess = add;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "add(a, b) = a + b;\nprocess = add;\n"
    }
  },
  "reference": "Faust syntax reference\n- Example: add(a, b) = a + b;\n- Comment: //\n- Run: faust {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
