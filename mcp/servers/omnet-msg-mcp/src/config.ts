import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "omnet-msg",
  "displayName": "OMNeT++ MSG",
  "version": "1.0.0",
  "extensions": [
    ".msg"
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
      "path": "src/demo.msg",
      "content": "message Demo { int value; }\n"
    },
    {
      "path": "tests/run.msg",
      "content": "message Demo { int value; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "message Demo { int value; }\n"
    }
  },
  "reference": "OMNeT++ MSG syntax reference\n- Example: message Demo { int value; }\n- Comment: //\n- No CLI runner configured"
}
