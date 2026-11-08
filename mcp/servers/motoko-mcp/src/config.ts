import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "motoko",
  "displayName": "Motoko",
  "version": "1.0.0",
  "extensions": [
    ".mo"
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
      "path": "src/demo.mo",
      "content": "actor Main { public func add(a: Nat, b: Nat): async Nat { a + b } }\n"
    },
    {
      "path": "tests/run.mo",
      "content": "actor Main { public func add(a: Nat, b: Nat): async Nat { a + b } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "actor Main { public func add(a: Nat, b: Nat): async Nat { a + b } }\n"
    }
  },
  "reference": "Motoko syntax reference\n- Example: actor Main { public func add(a: Nat, b: Nat): async Nat { a + b } }\n- Comment: //\n- No CLI runner configured"
}
