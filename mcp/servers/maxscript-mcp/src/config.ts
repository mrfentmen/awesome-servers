import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "maxscript",
  "displayName": "MAXScript",
  "version": "1.0.0",
  "extensions": [
    ".ms",
    ".mcr"
  ],
  "markers": [],
  "comment": "--",
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
      "path": "src/demo.ms",
      "content": "fn add a b = a + b\n"
    },
    {
      "path": "tests/run.ms",
      "content": "fn add a b = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn add a b = a + b\n"
    }
  },
  "reference": "MAXScript syntax reference\n- Example: fn add a b = a + b\n- Comment: --\n- No CLI runner configured"
}
