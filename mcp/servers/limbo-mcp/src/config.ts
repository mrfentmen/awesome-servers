import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "limbo",
  "displayName": "Limbo",
  "version": "1.0.0",
  "extensions": [
    ".b",
    ".m"
  ],
  "markers": [],
  "comment": "#",
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
      "path": "src/demo.b",
      "content": "implement Demo;\ninclude \"sys.m\";\n"
    },
    {
      "path": "tests/run.b",
      "content": "implement Demo;\ninclude \"sys.m\";\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "implement Demo;\ninclude \"sys.m\";\n"
    }
  },
  "reference": "Limbo syntax reference\n- Example: implement Demo;\n- Comment: #\n- No CLI runner configured"
}
