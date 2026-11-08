import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nasal",
  "displayName": "Nasal",
  "version": "1.0.0",
  "extensions": [
    ".nas"
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
      "path": "src/demo.nas",
      "content": "var x = 1;\n"
    },
    {
      "path": "tests/run.nas",
      "content": "var x = 1;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "var x = 1;\n"
    }
  },
  "reference": "Nasal syntax reference\n- Example: var x = 1;\n- Comment: #\n- No CLI runner configured"
}
