import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rez",
  "displayName": "Rez",
  "version": "1.0.0",
  "extensions": [
    ".r"
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
      "path": "src/demo.r",
      "content": "resource 'DITL' (128) { };\n"
    },
    {
      "path": "tests/run.r",
      "content": "resource 'DITL' (128) { };\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "resource 'DITL' (128) { };\n"
    }
  },
  "reference": "Rez syntax reference\n- Example: resource 'DITL' (128) { };\n- Comment: //\n- No CLI runner configured"
}
