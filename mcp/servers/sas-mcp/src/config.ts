import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sas",
  "displayName": "SAS",
  "version": "1.0.0",
  "extensions": [
    ".sas"
  ],
  "markers": [],
  "comment": "*",
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
      "path": "src/demo.sas",
      "content": "data demo; x = 2 + 2; run;\n"
    },
    {
      "path": "tests/run.sas",
      "content": "data demo; x = 2 + 2; run;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "data demo; x = 2 + 2; run;\n"
    }
  },
  "reference": "SAS syntax reference\n- Example: data demo; x = 2 + 2; run;\n- Comment: *\n- No CLI runner configured"
}
