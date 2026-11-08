import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jsoniq",
  "displayName": "JSONiq",
  "version": "1.0.0",
  "extensions": [
    ".jq"
  ],
  "markers": [],
  "comment": "(:",
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
      "path": "src/demo.jq",
      "content": "for $x in 1 to 3 return $x\n"
    },
    {
      "path": "tests/run.jq",
      "content": "for $x in 1 to 3 return $x\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "for $x in 1 to 3 return $x\n"
    }
  },
  "reference": "JSONiq syntax reference\n- Example: for $x in 1 to 3 return $x\n- Comment: (:\n- No CLI runner configured"
}
