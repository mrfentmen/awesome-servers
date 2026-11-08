import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "surrealql",
  "displayName": "SurrealQL",
  "version": "1.0.0",
  "extensions": [
    ".surql"
  ],
  "markers": [],
  "comment": "--",
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
      "path": "src/demo.surql",
      "content": "CREATE demo SET name = 'test';\n"
    },
    {
      "path": "tests/run.surql",
      "content": "CREATE demo SET name = 'test';\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "CREATE demo SET name = 'test';\n"
    }
  },
  "reference": "SurrealQL syntax reference\n- Example: CREATE demo SET name = 'test';\n- Comment: --\n- No CLI runner configured"
}
