import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "yacc",
  "displayName": "Yacc",
  "version": "1.0.0",
  "extensions": [
    ".y",
    ".yacc",
    ".yy"
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
      "path": "src/demo.y",
      "content": "%token NUMBER\n%%\nexpr: NUMBER ;\n%%\n"
    },
    {
      "path": "tests/run.y",
      "content": "%token NUMBER\n%%\nexpr: NUMBER ;\n%%\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%token NUMBER\n%%\nexpr: NUMBER ;\n%%\n"
    }
  },
  "reference": "Yacc syntax reference\n- Example: %token NUMBER\n- Comment: //\n- No CLI runner configured"
}
