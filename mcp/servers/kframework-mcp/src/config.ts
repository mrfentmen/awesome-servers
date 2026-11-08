import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "kframework",
  "displayName": "KFramework",
  "version": "1.0.0",
  "extensions": [
    ".k"
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
      "path": "src/demo.k",
      "content": "module DEMO\n  syntax Int ::= \"0\"\nendmodule\n"
    },
    {
      "path": "tests/run.k",
      "content": "module DEMO\n  syntax Int ::= \"0\"\nendmodule\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module DEMO\n  syntax Int ::= \"0\"\nendmodule\n"
    }
  },
  "reference": "KFramework syntax reference\n- Example: module DEMO\n- Comment: //\n- No CLI runner configured"
}
