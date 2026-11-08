import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "zephir",
  "displayName": "Zephir",
  "version": "1.0.0",
  "extensions": [
    ".zep"
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
      "path": "src/demo.zep",
      "content": "namespace Demo; class Main { }\n"
    },
    {
      "path": "tests/run.zep",
      "content": "namespace Demo; class Main { }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "namespace Demo; class Main { }\n"
    }
  },
  "reference": "Zephir syntax reference\n- Example: namespace Demo; class Main { }\n- Comment: //\n- No CLI runner configured"
}
