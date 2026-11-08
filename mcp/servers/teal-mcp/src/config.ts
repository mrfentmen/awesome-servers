import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "teal",
  "displayName": "Teal",
  "version": "1.0.0",
  "extensions": [
    ".tl"
  ],
  "markers": [],
  "comment": "--",
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
      "path": "src/demo.tl",
      "content": "local function add(a: number, b: number): number return a + b end\n"
    },
    {
      "path": "tests/run.tl",
      "content": "local function add(a: number, b: number): number return a + b end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "local function add(a: number, b: number): number return a + b end\n"
    }
  },
  "reference": "Teal syntax reference\n- Example: local function add(a: number, b: number): number return a + b end\n- Comment: --\n- No CLI runner configured"
}
