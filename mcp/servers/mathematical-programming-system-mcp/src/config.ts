import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mathematical-programming-system",
  "displayName": "Mathematical Programming System",
  "version": "1.0.0",
  "extensions": [
    ".mps"
  ],
  "markers": [],
  "comment": "*",
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
      "path": "src/demo.mps",
      "content": "NAME DEMO\nROWS\n N COST\n"
    },
    {
      "path": "tests/run.mps",
      "content": "NAME DEMO\nROWS\n N COST\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "NAME DEMO\nROWS\n N COST\n"
    }
  },
  "reference": "Mathematical Programming System syntax reference\n- Example: NAME DEMO\n- Comment: *\n- No CLI runner configured"
}
