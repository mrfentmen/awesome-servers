import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "propeller-spin",
  "displayName": "Propeller Spin",
  "version": "1.0.0",
  "extensions": [
    ".spin"
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
      "path": "src/demo.spin",
      "content": "PUB main\n"
    },
    {
      "path": "tests/run.spin",
      "content": "PUB main\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "PUB main\n"
    }
  },
  "reference": "Propeller Spin syntax reference\n- Example: PUB main\n- Comment: '\n- No CLI runner configured"
}
