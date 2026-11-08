import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "purebasic",
  "displayName": "PureBasic",
  "version": "1.0.0",
  "extensions": [
    ".pb",
    ".pbi"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.pb",
      "content": "Procedure Add(a, b)\n  ProcedureReturn a + b\nEndProcedure\n"
    },
    {
      "path": "tests/run.pb",
      "content": "Procedure Add(a, b)\n  ProcedureReturn a + b\nEndProcedure\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Procedure Add(a, b)\n  ProcedureReturn a + b\nEndProcedure\n"
    }
  },
  "reference": "PureBasic syntax reference\n- Example: Procedure Add(a, b)\n- Comment: ;\n- No CLI runner configured"
}
