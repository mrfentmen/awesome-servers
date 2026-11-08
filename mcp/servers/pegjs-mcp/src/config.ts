import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pegjs",
  "displayName": "PEG.js",
  "version": "1.0.0",
  "extensions": [
    ".pegjs",
    ".peggy"
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
      "path": "src/demo.pegjs",
      "content": "start = \"a\" { return \"a\"; }\n"
    },
    {
      "path": "tests/run.pegjs",
      "content": "start = \"a\" { return \"a\"; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "start = \"a\" { return \"a\"; }\n"
    }
  },
  "reference": "PEG.js syntax reference\n- Example: start = \"a\" { return \"a\"; }\n- Comment: //\n- No CLI runner configured"
}
