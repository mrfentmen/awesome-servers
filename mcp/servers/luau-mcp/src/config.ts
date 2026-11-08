import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "luau",
  "displayName": "Luau",
  "version": "1.0.0",
  "extensions": [
    ".luau"
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
      "path": "src/demo.luau",
      "content": "local function add(a, b) return a + b end\n"
    },
    {
      "path": "tests/run.luau",
      "content": "local function add(a, b) return a + b end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "local function add(a, b) return a + b end\n"
    }
  },
  "reference": "Luau syntax reference\n- Example: local function add(a, b) return a + b end\n- Comment: --\n- No CLI runner configured"
}
