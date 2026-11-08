import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ox",
  "displayName": "Ox",
  "version": "1.0.0",
  "extensions": [
    ".ox",
    ".oxh",
    ".oxo"
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
      "path": "src/demo.ox",
      "content": "func add(a, b) { return a + b; }\n"
    },
    {
      "path": "tests/run.ox",
      "content": "func add(a, b) { return a + b; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "func add(a, b) { return a + b; }\n"
    }
  },
  "reference": "Ox syntax reference\n- Example: func add(a, b) { return a + b; }\n- Comment: //\n- No CLI runner configured"
}
