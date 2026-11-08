import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "zimpl",
  "displayName": "Zimpl",
  "version": "1.0.0",
  "extensions": [
    ".zimpl",
    ".zmpl",
    ".zpl"
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
      "path": "src/demo.zimpl",
      "content": "param n := 3; var x[1..n] binary;\n"
    },
    {
      "path": "tests/run.zimpl",
      "content": "param n := 3; var x[1..n] binary;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "param n := 3; var x[1..n] binary;\n"
    }
  },
  "reference": "Zimpl syntax reference\n- Example: param n := 3; var x[1..n] binary;\n- Comment: #\n- No CLI runner configured"
}
