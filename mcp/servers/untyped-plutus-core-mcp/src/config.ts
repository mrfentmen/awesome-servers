import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "untyped-plutus-core",
  "displayName": "Untyped Plutus Core",
  "version": "1.0.0",
  "extensions": [
    ".uplc"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.uplc",
      "content": "(program 1.0.0 (lam x x))\n"
    },
    {
      "path": "tests/run.uplc",
      "content": "(program 1.0.0 (lam x x))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(program 1.0.0 (lam x x))\n"
    }
  },
  "reference": "Untyped Plutus Core syntax reference\n- Example: (program 1.0.0 (lam x x))\n- Comment: ;\n- No CLI runner configured"
}
