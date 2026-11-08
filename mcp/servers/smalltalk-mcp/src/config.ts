import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "smalltalk",
  "displayName": "Smalltalk",
  "version": "1.0.0",
  "extensions": [
    ".st",
    ".cs"
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
      "path": "src/demo.st",
      "content": "Object subclass: #Demo\n"
    },
    {
      "path": "tests/run.st",
      "content": "Object subclass: #Demo\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Object subclass: #Demo\n"
    }
  },
  "reference": "Smalltalk syntax reference\n- Example: Object subclass: #Demo\n- Comment: \"\n- No CLI runner configured"
}
