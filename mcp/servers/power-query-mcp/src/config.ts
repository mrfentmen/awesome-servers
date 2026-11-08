import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "power-query",
  "displayName": "Power Query",
  "version": "1.0.0",
  "extensions": [
    ".pq"
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
      "path": "src/demo.pq",
      "content": "let Source = 1 in Source\n"
    },
    {
      "path": "tests/run.pq",
      "content": "let Source = 1 in Source\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let Source = 1 in Source\n"
    }
  },
  "reference": "Power Query syntax reference\n- Example: let Source = 1 in Source\n- Comment: //\n- No CLI runner configured"
}
