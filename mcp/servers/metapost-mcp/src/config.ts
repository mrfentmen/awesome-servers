import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "metapost",
  "displayName": "MetaPost",
  "version": "1.0.0",
  "extensions": [
    ".mp"
  ],
  "markers": [],
  "comment": "%",
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
      "path": "src/demo.mp",
      "content": "beginfig(1); draw (0,0)--(10,10); endfig;\n"
    },
    {
      "path": "tests/run.mp",
      "content": "beginfig(1); draw (0,0)--(10,10); endfig;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "beginfig(1); draw (0,0)--(10,10); endfig;\n"
    }
  },
  "reference": "MetaPost syntax reference\n- Example: beginfig(1); draw (0,0)--(10,10); endfig;\n- Comment: %\n- No CLI runner configured"
}
