import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "omnet-ned",
  "displayName": "OMNeT++ NED",
  "version": "1.0.0",
  "extensions": [
    ".ned"
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
      "path": "src/demo.ned",
      "content": "simple Demo {}\n"
    },
    {
      "path": "tests/run.ned",
      "content": "simple Demo {}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "simple Demo {}\n"
    }
  },
  "reference": "OMNeT++ NED syntax reference\n- Example: simple Demo {}\n- Comment: //\n- No CLI runner configured"
}
