import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "antlr",
  "displayName": "ANTLR",
  "version": "1.0.0",
  "extensions": [
    ".g4"
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
      "path": "src/demo.g4",
      "content": "grammar Demo; start: 'a';\n"
    },
    {
      "path": "tests/run.g4",
      "content": "grammar Demo; start: 'a';\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "grammar Demo; start: 'a';\n"
    }
  },
  "reference": "ANTLR syntax reference\n- Example: grammar Demo; start: 'a';\n- Comment: //\n- No CLI runner configured"
}
