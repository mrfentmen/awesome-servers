import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sail",
  "displayName": "Sail",
  "version": "1.0.0",
  "extensions": [
    ".sail"
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
      "path": "src/demo.sail",
      "content": "val add : forall 'n, bits('n) -> bits('n) -> bits('n)\n"
    },
    {
      "path": "tests/run.sail",
      "content": "val add : forall 'n, bits('n) -> bits('n) -> bits('n)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "val add : forall 'n, bits('n) -> bits('n) -> bits('n)\n"
    }
  },
  "reference": "Sail syntax reference\n- Example: val add : forall 'n, bits('n) -> bits('n) -> bits('n)\n- Comment: //\n- No CLI runner configured"
}
