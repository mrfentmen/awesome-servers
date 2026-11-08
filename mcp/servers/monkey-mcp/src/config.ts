import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "monkey",
  "displayName": "Monkey",
  "version": "1.0.0",
  "extensions": [
    ".monkey",
    ".monkey2"
  ],
  "markers": [],
  "comment": "'",
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
      "path": "src/demo.monkey",
      "content": "Function Main()\n"
    },
    {
      "path": "tests/run.monkey",
      "content": "Function Main()\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Function Main()\n"
    }
  },
  "reference": "Monkey syntax reference\n- Example: Function Main()\n- Comment: '\n- No CLI runner configured"
}
