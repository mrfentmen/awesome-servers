import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nice",
  "displayName": "Nice",
  "version": "1.0.0",
  "extensions": [
    ".nice"
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
      "path": "src/demo.nice",
      "content": "class Demo {\n  int add(int a, int b) { return a + b; }\n}\n"
    },
    {
      "path": "tests/run.nice",
      "content": "class Demo {\n  int add(int a, int b) { return a + b; }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Demo {\n  int add(int a, int b) { return a + b; }\n}\n"
    }
  },
  "reference": "Nice syntax reference\n- Example: class Demo {",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
