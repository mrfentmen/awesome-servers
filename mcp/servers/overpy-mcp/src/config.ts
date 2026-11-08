import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "overpy",
  "displayName": "OverPy",
  "version": "1.0.0",
  "extensions": [
    ".opy"
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
      "path": "src/demo.opy",
      "content": "result = api.query(\"node(1); out;\")\n"
    },
    {
      "path": "tests/run.opy",
      "content": "result = api.query(\"node(1); out;\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "result = api.query(\"node(1); out;\")\n"
    }
  },
  "reference": "OverPy syntax reference\n- Example: result = api.query(\"node(1); out;\")\n- Comment: #\n- No CLI runner configured"
}
