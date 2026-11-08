import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lolcode",
  "displayName": "LOLCODE",
  "version": "1.0.0",
  "extensions": [
    ".lol"
  ],
  "markers": [],
  "comment": "BTW",
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
      "path": "src/demo.lol",
      "content": "HAI 1.2\nVISIBLE \"HAI\"\nKTHXBYE\n"
    },
    {
      "path": "tests/run.lol",
      "content": "HAI 1.2\nVISIBLE \"HAI\"\nKTHXBYE\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "HAI 1.2\nVISIBLE \"HAI\"\nKTHXBYE\n"
    }
  },
  "reference": "LOLCODE syntax reference\n- Example: HAI 1.2\n- Comment: BTW\n- No CLI runner configured"
}
