import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "monkey-c",
  "displayName": "Monkey C",
  "version": "1.0.0",
  "extensions": [
    ".mc"
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
      "path": "src/demo.mc",
      "content": "function main() { }\n"
    },
    {
      "path": "tests/run.mc",
      "content": "function main() { }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function main() { }\n"
    }
  },
  "reference": "Monkey C syntax reference\n- Example: function main() { }\n- Comment: //\n- No CLI runner configured"
}
