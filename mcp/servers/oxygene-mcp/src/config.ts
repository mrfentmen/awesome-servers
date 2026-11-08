import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "oxygene",
  "displayName": "Oxygene",
  "version": "1.0.0",
  "extensions": [
    ".oxygene"
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
      "path": "src/demo.oxygene",
      "content": "namespace Demo;\n"
    },
    {
      "path": "tests/run.oxygene",
      "content": "namespace Demo;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "namespace Demo;\n"
    }
  },
  "reference": "Oxygene syntax reference\n- Example: namespace Demo;\n- Comment: //\n- No CLI runner configured"
}
