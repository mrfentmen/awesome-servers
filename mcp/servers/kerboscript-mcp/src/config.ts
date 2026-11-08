import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "kerboscript",
  "displayName": "KerboScript",
  "version": "1.0.0",
  "extensions": [
    ".ks"
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
      "path": "src/demo.ks",
      "content": "set x to 1.\n"
    },
    {
      "path": "tests/run.ks",
      "content": "set x to 1.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "set x to 1.\n"
    }
  },
  "reference": "KerboScript syntax reference\n- Example: set x to 1.\n- Comment: //\n- No CLI runner configured"
}
