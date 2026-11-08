import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mint",
  "displayName": "Mint",
  "version": "1.0.0",
  "extensions": [
    ".mint"
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
      "path": "src/demo.mint",
      "content": "module Main { fun main() { } }\n"
    },
    {
      "path": "tests/run.mint",
      "content": "module Main { fun main() { } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Main { fun main() { } }\n"
    }
  },
  "reference": "Mint syntax reference\n- Example: module Main { fun main() { } }\n- Comment: //\n- No CLI runner configured"
}
