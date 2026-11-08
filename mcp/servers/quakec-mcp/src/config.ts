import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "quakec",
  "displayName": "QuakeC",
  "version": "1.0.0",
  "extensions": [
    ".qc"
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
      "path": "src/demo.qc",
      "content": "void() main = {};\n"
    },
    {
      "path": "tests/run.qc",
      "content": "void() main = {};\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "void() main = {};\n"
    }
  },
  "reference": "QuakeC syntax reference\n- Example: void() main = {};\n- Comment: //\n- No CLI runner configured"
}
