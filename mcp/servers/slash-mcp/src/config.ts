import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "slash",
  "displayName": "Slash",
  "version": "1.0.0",
  "extensions": [
    ".sl"
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
      "path": "src/demo.sl",
      "content": "model Demo;\n"
    },
    {
      "path": "tests/run.sl",
      "content": "model Demo;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "model Demo;\n"
    }
  },
  "reference": "Slash syntax reference\n- Example: model Demo;\n- Comment: //\n- No CLI runner configured"
}
