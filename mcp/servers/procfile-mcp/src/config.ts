import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "procfile",
  "displayName": "Procfile",
  "version": "1.0.0",
  "extensions": [
    ".txt"
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
      "path": "src/demo.txt",
      "content": "web: node index.js\n"
    },
    {
      "path": "tests/run.txt",
      "content": "web: node index.js\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "web: node index.js\n"
    }
  },
  "reference": "Procfile syntax reference\n- Example: web: node index.js\n- Comment: #\n- No CLI runner configured"
}
