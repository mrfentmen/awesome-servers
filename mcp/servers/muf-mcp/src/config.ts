import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "muf",
  "displayName": "MUF",
  "version": "1.0.0",
  "extensions": [
    ".muf",
    ".m"
  ],
  "markers": [],
  "comment": "( ",
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
      "path": "src/demo.muf",
      "content": ": main \"hello\" . ;\n"
    },
    {
      "path": "tests/run.muf",
      "content": ": main \"hello\" . ;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ": main \"hello\" . ;\n"
    }
  },
  "reference": "MUF syntax reference\n- Example: : main \"hello\" . ;\n- Comment: ( \n- No CLI runner configured"
}
