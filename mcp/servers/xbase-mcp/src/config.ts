import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xbase",
  "displayName": "xBase",
  "version": "1.0.0",
  "extensions": [
    ".prg",
    ".ch",
    ".prw"
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
      "path": "src/demo.prg",
      "content": "PROCEDURE Main\nRETURN\n"
    },
    {
      "path": "tests/run.prg",
      "content": "PROCEDURE Main\nRETURN\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "PROCEDURE Main\nRETURN\n"
    }
  },
  "reference": "xBase syntax reference\n- Example: PROCEDURE Main\n- Comment: //\n- No CLI runner configured"
}
