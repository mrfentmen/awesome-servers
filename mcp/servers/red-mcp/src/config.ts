import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "red",
  "displayName": "Red",
  "version": "1.0.0",
  "extensions": [
    ".red",
    ".reds"
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
      "path": "src/demo.red",
      "content": "Red [Title: \"Demo\"]\n"
    },
    {
      "path": "tests/run.red",
      "content": "Red [Title: \"Demo\"]\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Red [Title: \"Demo\"]\n"
    }
  },
  "reference": "Red syntax reference\n- Example: Red [Title: \"Demo\"]\n- Comment: ;\n- No CLI runner configured"
}
