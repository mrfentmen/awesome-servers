import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "overpassql",
  "displayName": "OverpassQL",
  "version": "1.0.0",
  "extensions": [
    ".overpassql"
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
      "path": "src/demo.overpassql",
      "content": "[out:json]; node(1); out;\n"
    },
    {
      "path": "tests/run.overpassql",
      "content": "[out:json]; node(1); out;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "[out:json]; node(1); out;\n"
    }
  },
  "reference": "OverpassQL syntax reference\n- Example: [out:json]; node(1); out;\n- Comment: //\n- No CLI runner configured"
}
