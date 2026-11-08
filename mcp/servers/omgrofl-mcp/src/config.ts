import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "omgrofl",
  "displayName": "Omgrofl",
  "version": "1.0.0",
  "extensions": [
    ".omgrofl"
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
      "path": "src/demo.omgrofl",
      "content": "lol x is 1\n"
    },
    {
      "path": "tests/run.omgrofl",
      "content": "lol x is 1\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "lol x is 1\n"
    }
  },
  "reference": "Omgrofl syntax reference\n- Example: lol x is 1\n- Comment: #\n- No CLI runner configured"
}
