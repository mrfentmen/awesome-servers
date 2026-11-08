import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "moonscript",
  "displayName": "MoonScript",
  "version": "1.0.0",
  "extensions": [
    ".moon"
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
      "path": "src/demo.moon",
      "content": "add = (a, b) -> a + b\n"
    },
    {
      "path": "tests/run.moon",
      "content": "add = (a, b) -> a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "add = (a, b) -> a + b\n"
    }
  },
  "reference": "MoonScript syntax reference\n- Example: add = (a, b) -> a + b\n- Comment: --\n- No CLI runner configured"
}
