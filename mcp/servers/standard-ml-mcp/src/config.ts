import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "standard-ml",
  "displayName": "Standard ML",
  "version": "1.0.0",
  "extensions": [
    ".ml",
    ".fun",
    ".sig",
    ".sml"
  ],
  "markers": [],
  "comment": "(*",
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
      "path": "src/demo.ml",
      "content": "fun add (a, b) = a + b\n"
    },
    {
      "path": "tests/run.ml",
      "content": "fun add (a, b) = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun add (a, b) = a + b\n"
    }
  },
  "reference": "Standard ML syntax reference\n- Example: fun add (a, b) = a + b\n- Comment: (*\n- No CLI runner configured"
}
