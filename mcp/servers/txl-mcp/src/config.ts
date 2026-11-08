import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "txl",
  "displayName": "TXL",
  "version": "1.0.0",
  "extensions": [
    ".txl"
  ],
  "markers": [],
  "comment": "%",
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
      "path": "src/demo.txl",
      "content": "%include \"demo.Txl\"\n"
    },
    {
      "path": "tests/run.txl",
      "content": "%include \"demo.Txl\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%include \"demo.Txl\"\n"
    }
  },
  "reference": "TXL syntax reference\n- Example: %include \"demo.Txl\"\n- Comment: %\n- No CLI runner configured"
}
