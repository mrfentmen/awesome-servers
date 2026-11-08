import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "opal",
  "displayName": "Opal",
  "version": "1.0.0",
  "extensions": [
    ".opal"
  ],
  "markers": [],
  "comment": "--",
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
      "path": "src/demo.opal",
      "content": "MODULE Demo;\n"
    },
    {
      "path": "tests/run.opal",
      "content": "MODULE Demo;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MODULE Demo;\n"
    }
  },
  "reference": "Opal syntax reference\n- Example: MODULE Demo;\n- Comment: --\n- No CLI runner configured"
}
