import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "moocode",
  "displayName": "Moocode",
  "version": "1.0.0",
  "extensions": [
    ".moo"
  ],
  "markers": [],
  "comment": "\"",
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
      "path": "src/demo.moo",
      "content": "@program demo:main() player:tell(\"hello\"); .\n"
    },
    {
      "path": "tests/run.moo",
      "content": "@program demo:main() player:tell(\"hello\"); .\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "@program demo:main() player:tell(\"hello\"); .\n"
    }
  },
  "reference": "Moocode syntax reference\n- Example: @program demo:main() player:tell(\"hello\"); .\n- Comment: \"\n- No CLI runner configured"
}
