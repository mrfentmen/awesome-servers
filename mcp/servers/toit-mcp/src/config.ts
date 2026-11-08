import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "toit",
  "displayName": "Toit",
  "version": "1.0.0",
  "extensions": [
    ".toit"
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
      "path": "src/demo.toit",
      "content": "main: print \"hello\"\n"
    },
    {
      "path": "tests/run.toit",
      "content": "main: print \"hello\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "main: print \"hello\"\n"
    }
  },
  "reference": "Toit syntax reference\n- Example: main: print \"hello\"\n- Comment: //\n- No CLI runner configured"
}
