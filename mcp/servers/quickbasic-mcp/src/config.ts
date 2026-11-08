import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "quickbasic",
  "displayName": "QuickBASIC",
  "version": "1.0.0",
  "extensions": [
    ".bas",
    ".bi"
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
      "path": "src/demo.bas",
      "content": "PRINT 2 + 2\n"
    },
    {
      "path": "tests/run.bas",
      "content": "PRINT 2 + 2\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "PRINT 2 + 2\n"
    }
  },
  "reference": "QuickBASIC syntax reference\n- Example: PRINT 2 + 2\n- Comment: '\n- No CLI runner configured"
}
