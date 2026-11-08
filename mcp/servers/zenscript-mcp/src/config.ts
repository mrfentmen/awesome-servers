import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "zenscript",
  "displayName": "ZenScript",
  "version": "1.0.0",
  "extensions": [
    ".zs"
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
      "path": "src/demo.zs",
      "content": "function add(a, b) { return a + b; }\n"
    },
    {
      "path": "tests/run.zs",
      "content": "function add(a, b) { return a + b; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a, b) { return a + b; }\n"
    }
  },
  "reference": "ZenScript syntax reference\n- Example: function add(a, b) { return a + b; }\n- Comment: //\n- No CLI runner configured"
}
