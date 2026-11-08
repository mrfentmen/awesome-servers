import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "scenic",
  "displayName": "Scenic",
  "version": "1.0.0",
  "extensions": [
    ".scenic"
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
      "path": "src/demo.scenic",
      "content": "scenario demo:\n"
    },
    {
      "path": "tests/run.scenic",
      "content": "scenario demo:\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "scenario demo:\n"
    }
  },
  "reference": "Scenic syntax reference\n- Example: scenario demo:\n- Comment: #\n- No CLI runner configured"
}
