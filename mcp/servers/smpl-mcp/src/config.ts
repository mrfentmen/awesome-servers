import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "smpl",
  "displayName": "SmPL",
  "version": "1.0.0",
  "extensions": [
    ".cocci"
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
      "path": "src/demo.cocci",
      "content": "@@ expression e; @@\n"
    },
    {
      "path": "tests/run.cocci",
      "content": "@@ expression e; @@\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "@@ expression e; @@\n"
    }
  },
  "reference": "SmPL syntax reference\n- Example: @@ expression e; @@\n- Comment: //\n- No CLI runner configured"
}
