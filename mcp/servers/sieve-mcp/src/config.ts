import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sieve",
  "displayName": "Sieve",
  "version": "1.0.0",
  "extensions": [
    ".sieve"
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
      "path": "src/demo.sieve",
      "content": "require \"fileinto\";\n"
    },
    {
      "path": "tests/run.sieve",
      "content": "require \"fileinto\";\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "require \"fileinto\";\n"
    }
  },
  "reference": "Sieve syntax reference\n- Example: require \"fileinto\";\n- Comment: #\n- No CLI runner configured"
}
