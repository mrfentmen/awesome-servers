import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "zil",
  "displayName": "ZIL",
  "version": "1.0.0",
  "extensions": [
    ".zil",
    ".mud"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.zil",
      "content": "<ROUTINE DEMO () <TELL \"Hello\">>\n"
    },
    {
      "path": "tests/run.zil",
      "content": "<ROUTINE DEMO () <TELL \"Hello\">>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<ROUTINE DEMO () <TELL \"Hello\">>\n"
    }
  },
  "reference": "ZIL syntax reference\n- Example: <ROUTINE DEMO () <TELL \"Hello\">>\n- Comment: ;\n- No CLI runner configured"
}
