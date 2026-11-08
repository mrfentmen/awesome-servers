import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vyper",
  "displayName": "Vyper",
  "version": "1.0.0",
  "extensions": [
    ".vy"
  ],
  "markers": [],
  "comment": "#",
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
      "path": "src/demo.vy",
      "content": "@external\ndef add(a: uint256, b: uint256) -> uint256:\n    return a + b\n"
    },
    {
      "path": "tests/run.vy",
      "content": "@external\ndef add(a: uint256, b: uint256) -> uint256:\n    return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "@external\ndef add(a: uint256, b: uint256) -> uint256:\n    return a + b\n"
    }
  },
  "reference": "Vyper syntax reference\n- Example: @external\n- Comment: #\n- No CLI runner configured"
}
