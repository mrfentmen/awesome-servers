import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rpgle",
  "displayName": "RPGLE",
  "version": "1.0.0",
  "extensions": [
    ".rpgle",
    ".sqlrpgle"
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
      "path": "src/demo.rpgle",
      "content": "**free\n dcl-s x int(10);\n"
    },
    {
      "path": "tests/run.rpgle",
      "content": "**free\n dcl-s x int(10);\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "**free\n dcl-s x int(10);\n"
    }
  },
  "reference": "RPGLE syntax reference\n- Example: **free\n- Comment: //\n- No CLI runner configured"
}
