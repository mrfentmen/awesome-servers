import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pep8",
  "displayName": "Pep8",
  "version": "1.0.0",
  "extensions": [
    ".pep"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.pep",
      "content": "LDWA 0,i\nSTWA 0,i\nSTOP\n"
    },
    {
      "path": "tests/run.pep",
      "content": "LDWA 0,i\nSTWA 0,i\nSTOP\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "LDWA 0,i\nSTWA 0,i\nSTOP\n"
    }
  },
  "reference": "Pep8 syntax reference\n- Example: LDWA 0,i\n- Comment: ;\n- No CLI runner configured"
}
