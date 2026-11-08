import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "piglatin",
  "displayName": "PigLatin",
  "version": "1.0.0",
  "extensions": [
    ".pig"
  ],
  "markers": [],
  "comment": "--",
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
      "path": "src/demo.pig",
      "content": "A = LOAD 'data' AS (x:int);\n"
    },
    {
      "path": "tests/run.pig",
      "content": "A = LOAD 'data' AS (x:int);\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "A = LOAD 'data' AS (x:int);\n"
    }
  },
  "reference": "PigLatin syntax reference\n- Example: A = LOAD 'data' AS (x:int);\n- Comment: --\n- No CLI runner configured"
}
