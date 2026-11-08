import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "realbasic",
  "displayName": "REALbasic",
  "version": "1.0.0",
  "extensions": [
    ".rbbas",
    ".rbfrm",
    ".rbmnu"
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
      "path": "src/demo.rbbas",
      "content": "Sub Main()\nEnd Sub\n"
    },
    {
      "path": "tests/run.rbbas",
      "content": "Sub Main()\nEnd Sub\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Sub Main()\nEnd Sub\n"
    }
  },
  "reference": "REALbasic syntax reference\n- Example: Sub Main()\n- Comment: '\n- No CLI runner configured"
}
