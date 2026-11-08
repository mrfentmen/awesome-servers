import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sage",
  "displayName": "Sage",
  "version": "1.0.0",
  "extensions": [
    ".sage",
    ".sagews"
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
      "path": "src/demo.sage",
      "content": "def add(a, b): return a + b\n"
    },
    {
      "path": "tests/run.sage",
      "content": "def add(a, b): return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b): return a + b\n"
    }
  },
  "reference": "Sage syntax reference\n- Example: def add(a, b): return a + b\n- Comment: #\n- No CLI runner configured"
}
