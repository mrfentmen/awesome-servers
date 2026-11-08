import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lex",
  "displayName": "Lex",
  "version": "1.0.0",
  "extensions": [
    ".l",
    ".lex"
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
      "path": "src/demo.l",
      "content": "%%\n[0-9]+ return NUMBER;\n%%\n"
    },
    {
      "path": "tests/run.l",
      "content": "%%\n[0-9]+ return NUMBER;\n%%\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%%\n[0-9]+ return NUMBER;\n%%\n"
    }
  },
  "reference": "Lex syntax reference\n- Example: %%\n- Comment: //\n- No CLI runner configured"
}
