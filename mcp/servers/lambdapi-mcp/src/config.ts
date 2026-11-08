import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lambdapi",
  "displayName": "Lambdapi",
  "version": "1.0.0",
  "extensions": [
    ".lp"
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
      "path": "src/demo.lp",
      "content": "symbol add : Nat -> Nat -> Nat;\n"
    },
    {
      "path": "tests/run.lp",
      "content": "symbol add : Nat -> Nat -> Nat;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "symbol add : Nat -> Nat -> Nat;\n"
    }
  },
  "reference": "Lambdapi syntax reference\n- Example: symbol add : Nat -> Nat -> Nat;\n- Comment: //\n- No CLI runner configured"
}
