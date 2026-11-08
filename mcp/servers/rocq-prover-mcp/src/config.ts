import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rocq-prover",
  "displayName": "Rocq Prover",
  "version": "1.0.0",
  "extensions": [
    ".v",
    ".coq"
  ],
  "markers": [],
  "comment": "(*",
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
      "path": "src/demo.v",
      "content": "Theorem add_0 : forall n, n + 0 = n.\n"
    },
    {
      "path": "tests/run.v",
      "content": "Theorem add_0 : forall n, n + 0 = n.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Theorem add_0 : forall n, n + 0 = n.\n"
    }
  },
  "reference": "Rocq Prover syntax reference\n- Example: Theorem add_0 : forall n, n + 0 = n.\n- Comment: (*\n- No CLI runner configured"
}
