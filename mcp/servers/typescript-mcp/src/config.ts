import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "typescript",
  "displayName": "TypeScript",
  "version": "1.0.0",
  "extensions": [
    ".ts",
    ".cts",
    ".mts"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object)\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][\\w<>\\[\\]]*\\s+)+([A-Za-z_]\\w*)\\s*\\("
    },
    {
      "kind": "value",
      "pattern": "^([A-Za-z_]\\w*)\\s*(?::=|=|:)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ts",
      "content": "function add(a: number, b: number): number { return a + b }\n"
    },
    {
      "path": "tests/run.ts",
      "content": "function add(a: number, b: number): number { return a + b }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a: number, b: number): number { return a + b }\n"
    }
  },
  "reference": "TypeScript syntax reference\n- Example: function add(a: number, b: number): number { return a + b }\n- Comment: //\n- No CLI runner configured"
}
