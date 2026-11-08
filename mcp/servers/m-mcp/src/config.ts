import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "m",
  "displayName": "M",
  "version": "1.0.0",
  "extensions": [
    ".mumps",
    ".m"
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
      "path": "src/demo.mumps",
      "content": "DEMO ; write \"hello\",!\n"
    },
    {
      "path": "tests/run.mumps",
      "content": "DEMO ; write \"hello\",!\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "DEMO ; write \"hello\",!\n"
    }
  },
  "reference": "M syntax reference\n- Example: DEMO ; write \"hello\",!\n- Comment: ;\n- No CLI runner configured"
}
