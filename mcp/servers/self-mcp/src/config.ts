import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "self",
  "displayName": "Self",
  "version": "1.0.0",
  "extensions": [
    ".self"
  ],
  "markers": [],
  "comment": "\"",
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
      "path": "src/demo.self",
      "content": "(\n"
    },
    {
      "path": "tests/run.self",
      "content": "(\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(\n"
    }
  },
  "reference": "Self syntax reference\n- Example: (\n- Comment: \"\n- Run:  parent* = traits clonable "
}
