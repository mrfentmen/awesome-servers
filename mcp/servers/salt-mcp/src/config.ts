import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "salt",
  "displayName": "Salt",
  "version": "1.0.0",
  "extensions": [
    ".sls"
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
      "path": "src/demo.sls",
      "content": "demo:\n  cmd.run:\n    - echo hello\n"
    },
    {
      "path": "tests/run.sls",
      "content": "demo:\n  cmd.run:\n    - echo hello\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "demo:\n  cmd.run:\n    - echo hello\n"
    }
  },
  "reference": "Salt syntax reference\n- Example: demo:\n- Comment: #\n- No CLI runner configured"
}
