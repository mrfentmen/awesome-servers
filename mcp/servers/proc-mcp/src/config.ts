import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "proc",
  "displayName": "Pro*C",
  "version": "1.0.0",
  "extensions": [
    ".pc"
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
      "path": "src/demo.pc",
      "content": "EXEC SQL SELECT 1;\n"
    },
    {
      "path": "tests/run.pc",
      "content": "EXEC SQL SELECT 1;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "EXEC SQL SELECT 1;\n"
    }
  },
  "reference": "Pro*C syntax reference\n- Example: EXEC SQL SELECT 1;\n- Comment: /*\n- No CLI runner configured"
}
