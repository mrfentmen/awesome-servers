import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "swig",
  "displayName": "SWIG",
  "version": "1.0.0",
  "extensions": [
    ".i",
    ".swg",
    ".swig"
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
      "path": "src/demo.i",
      "content": "%module demo\n"
    },
    {
      "path": "tests/run.i",
      "content": "%module demo\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%module demo\n"
    }
  },
  "reference": "SWIG syntax reference\n- Example: %module demo\n- Comment: //\n- No CLI runner configured"
}
