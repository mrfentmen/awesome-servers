import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ncl",
  "displayName": "NCL",
  "version": "1.0.0",
  "extensions": [
    ".ncl"
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
      "path": "src/demo.ncl",
      "content": "begin\n  print(2+2)\nend\n"
    },
    {
      "path": "tests/run.ncl",
      "content": "begin\n  print(2+2)\nend\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "begin\n  print(2+2)\nend\n"
    }
  },
  "reference": "NCL syntax reference\n- Example: begin\n- Comment: ;\n- No CLI runner configured"
}
