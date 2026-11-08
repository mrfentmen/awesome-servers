import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "powerbuilder",
  "displayName": "PowerBuilder",
  "version": "1.0.0",
  "extensions": [
    ".pbt",
    ".sra",
    ".sru",
    ".srw"
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
      "path": "src/demo.pbt",
      "content": "global type demo from object\n"
    },
    {
      "path": "tests/run.pbt",
      "content": "global type demo from object\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "global type demo from object\n"
    }
  },
  "reference": "PowerBuilder syntax reference\n- Example: global type demo from object\n- Comment: //\n- No CLI runner configured"
}
