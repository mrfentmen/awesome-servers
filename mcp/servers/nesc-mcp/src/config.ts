import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nesc",
  "displayName": "nesC",
  "version": "1.0.0",
  "extensions": [
    ".nc"
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
      "path": "src/demo.nc",
      "content": "module Demo { } implementation { }\n"
    },
    {
      "path": "tests/run.nc",
      "content": "module Demo { } implementation { }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Demo { } implementation { }\n"
    }
  },
  "reference": "nesC syntax reference\n- Example: module Demo { } implementation { }\n- Comment: //\n- No CLI runner configured"
}
