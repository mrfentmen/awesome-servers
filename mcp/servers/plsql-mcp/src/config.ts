import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "plsql",
  "displayName": "PLSQL",
  "version": "1.0.0",
  "extensions": [
    ".pls",
    ".bdy",
    ".pkb",
    ".pks",
    ".prc",
    ".sql",
    ".trg"
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
      "path": "src/demo.pls",
      "content": "BEGIN NULL; END;\n"
    },
    {
      "path": "tests/run.pls",
      "content": "BEGIN NULL; END;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "BEGIN NULL; END;\n"
    }
  },
  "reference": "PLSQL syntax reference\n- Example: BEGIN NULL; END;\n- Comment: --\n- No CLI runner configured"
}
