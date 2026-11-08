import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mql5",
  "displayName": "MQL5",
  "version": "1.0.0",
  "extensions": [
    ".mq5",
    ".mqh"
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
      "path": "src/demo.mq5",
      "content": "int OnInit() { return INIT_SUCCEEDED; }\n"
    },
    {
      "path": "tests/run.mq5",
      "content": "int OnInit() { return INIT_SUCCEEDED; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int OnInit() { return INIT_SUCCEEDED; }\n"
    }
  },
  "reference": "MQL5 syntax reference\n- Example: int OnInit() { return INIT_SUCCEEDED; }\n- Comment: //\n- No CLI runner configured"
}
