import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "linear-programming",
  "displayName": "Linear Programming",
  "version": "1.0.0",
  "extensions": [
    ".lp"
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
      "path": "src/demo.lp",
      "content": "max: 2x + 3y;\n"
    },
    {
      "path": "tests/run.lp",
      "content": "max: 2x + 3y;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "max: 2x + 3y;\n"
    }
  },
  "reference": "Linear Programming syntax reference\n- Example: max: 2x + 3y;\n- Comment: #\n- No CLI runner configured"
}
