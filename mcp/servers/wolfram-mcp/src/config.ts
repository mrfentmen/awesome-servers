import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "wolfram",
  "displayName": "Wolfram Language",
  "version": "1.0.0",
  "extensions": [
    ".wl",
    ".wls",
    ".nb"
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
      "path": "src/demo.wl",
      "content": "add[a_, b_] := a + b\n"
    },
    {
      "path": "tests/run.wl",
      "content": "add[a_, b_] := a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "add[a_, b_] := a + b\n"
    }
  },
  "reference": "Wolfram Language syntax reference\n- Example: add[a_, b_] := a + b\n- Comment: (*\n- No CLI runner configured"
}
