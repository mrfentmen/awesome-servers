import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "algol",
  "displayName": "ALGOL",
  "version": "1.0.0",
  "extensions": [
    ".alg"
  ],
  "markers": [],
  "comment": "#",
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
      "path": "src/demo.alg",
      "content": "BEGIN print(2 + 2) END\n"
    },
    {
      "path": "tests/run.alg",
      "content": "BEGIN print(2 + 2) END\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "BEGIN print(2 + 2) END\n"
    }
  },
  "reference": "ALGOL syntax reference\n- Example: BEGIN print(2 + 2) END\n- Comment: #\n- No CLI runner configured"
}
