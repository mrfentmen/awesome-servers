import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "minizinc",
  "displayName": "MiniZinc",
  "version": "1.0.0",
  "extensions": [
    ".mzn"
  ],
  "markers": [],
  "comment": "%",
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
      "path": "src/demo.mzn",
      "content": "var 1..10: x; constraint x > 2; solve satisfy;\n"
    },
    {
      "path": "tests/run.mzn",
      "content": "var 1..10: x; constraint x > 2; solve satisfy;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "var 1..10: x; constraint x > 2; solve satisfy;\n"
    }
  },
  "reference": "MiniZinc syntax reference\n- Example: var 1..10: x; constraint x > 2; solve satisfy;\n- Comment: %\n- No CLI runner configured"
}
