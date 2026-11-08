import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bf",
  "displayName": "Brainfuck",
  "version": "1.0.0",
  "extensions": [
    ".b",
    ".bf"
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
      "content": "++++[>++++<-]>.\n"
    },
    {
      "path": "tests/run.b",
      "content": "++++[>++++<-]>.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "++++[>++++<-]>.\n"
    }
  },
  "reference": "Brainfuck syntax reference\n- Example: ++++[>++++<-]>.\n- Comment: #\n- No CLI runner configured"
}
