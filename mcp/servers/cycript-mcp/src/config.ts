import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cycript",
  "displayName": "Cycript",
  "version": "1.0.0",
  "extensions": [
    ".cy"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.cy",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.cy",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a, b) {\n  return a + b;\n}\n"
    }
  },
  "reference": "Cycript syntax reference\n- Example: function add(a, b) {\n- Comment: //\n- Run: cycript -f {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
