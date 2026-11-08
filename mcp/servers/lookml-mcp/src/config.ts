import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lookml",
  "displayName": "LookML",
  "version": "1.0.0",
  "extensions": [
    ".lkml",
    ".lookml"
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
      "path": "src/demo.lkml",
      "content": "view: demo { sql_table_name: demo ;; }\n"
    },
    {
      "path": "tests/run.lkml",
      "content": "view: demo { sql_table_name: demo ;; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "view: demo { sql_table_name: demo ;; }\n"
    }
  },
  "reference": "LookML syntax reference\n- Example: view: demo { sql_table_name: demo ;; }\n- Comment: #\n- No CLI runner configured"
}
