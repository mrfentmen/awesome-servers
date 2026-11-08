import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "krl",
  "displayName": "KRL",
  "version": "1.0.0",
  "extensions": [
    ".krl"
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
      "path": "src/demo.krl",
      "content": "rule demo { select when pageview \".*\" { notify(\"Hi\"); } }\n"
    },
    {
      "path": "tests/run.krl",
      "content": "rule demo { select when pageview \".*\" { notify(\"Hi\"); } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "rule demo { select when pageview \".*\" { notify(\"Hi\"); } }\n"
    }
  },
  "reference": "KRL syntax reference\n- Example: rule demo { select when pageview \".*\" { notify(\"Hi\"); } }\n- Comment: //\n- No CLI runner configured"
}
