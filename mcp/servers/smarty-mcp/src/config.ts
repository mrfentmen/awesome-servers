import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "smarty",
  "displayName": "Smarty",
  "version": "1.0.0",
  "extensions": [
    ".tpl"
  ],
  "markers": [],
  "comment": "{*",
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
      "path": "src/demo.tpl",
      "content": "{$name}\n"
    },
    {
      "path": "tests/run.tpl",
      "content": "{$name}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "{$name}\n"
    }
  },
  "reference": "Smarty syntax reference\n- Example: {$name}\n- Comment: {*\n- No CLI runner configured"
}
