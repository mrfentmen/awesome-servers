import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ec",
  "displayName": "eC",
  "version": "1.0.0",
  "extensions": [
    ".ec",
    ".eh"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ec",
      "content": "class Demo : Application {\n  int add(int a, int b) { return a + b; }\n}\n"
    },
    {
      "path": "tests/run.ec",
      "content": "class Demo : Application {\n  int add(int a, int b) { return a + b; }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Demo : Application {\n  int add(int a, int b) { return a + b; }\n}\n"
    }
  },
  "reference": "eC syntax reference\n- Example: class Demo : Application {\n- Comment: //\n- Run: ecp {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
