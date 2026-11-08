import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "portugol",
  "displayName": "Portugol",
  "version": "1.0.0",
  "extensions": [
    ".por"
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
      "path": "src/demo.por",
      "content": "algoritmo \"Demo\" inicio fim\n"
    },
    {
      "path": "tests/run.por",
      "content": "algoritmo \"Demo\" inicio fim\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "algoritmo \"Demo\" inicio fim\n"
    }
  },
  "reference": "Portugol syntax reference\n- Example: algoritmo \"Demo\" inicio fim\n- Comment: //\n- No CLI runner configured"
}
