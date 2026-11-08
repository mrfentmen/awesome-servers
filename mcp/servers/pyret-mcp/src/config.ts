import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pyret",
  "displayName": "Pyret",
  "version": "1.0.0",
  "extensions": [
    ".arr"
  ],
  "markers": [],
  "comment": "#",
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
      "path": "src/demo.arr",
      "content": "fun add(a, b): a + b end\n"
    },
    {
      "path": "tests/run.arr",
      "content": "fun add(a, b): a + b end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun add(a, b): a + b end\n"
    }
  },
  "reference": "Pyret syntax reference\n- Example: fun add(a, b): a + b end\n- Comment: #\n- No CLI runner configured"
}
