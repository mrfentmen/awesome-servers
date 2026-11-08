import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jison-lex",
  "displayName": "Jison Lex",
  "version": "1.0.0",
  "extensions": [
    ".jisonlex"
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
      "path": "src/demo.jisonlex",
      "content": "%%\n[a-z]+ return 'WORD';\n%%\n"
    },
    {
      "path": "tests/run.jisonlex",
      "content": "%%\n[a-z]+ return 'WORD';\n%%\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%%\n[a-z]+ return 'WORD';\n%%\n"
    }
  },
  "reference": "Jison Lex syntax reference\n- Example: %%\n- Comment: //\n- No CLI runner configured"
}
