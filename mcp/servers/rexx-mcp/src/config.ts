import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rexx",
  "displayName": "REXX",
  "version": "1.0.0",
  "extensions": [
    ".rexx",
    ".pprx",
    ".rex"
  ],
  "markers": [],
  "comment": "/*",
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
      "path": "src/demo.rexx",
      "content": "say 2 + 2\n"
    },
    {
      "path": "tests/run.rexx",
      "content": "say 2 + 2\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "say 2 + 2\n"
    }
  },
  "reference": "REXX syntax reference\n- Example: say 2 + 2\n- Comment: /*\n- No CLI runner configured"
}
