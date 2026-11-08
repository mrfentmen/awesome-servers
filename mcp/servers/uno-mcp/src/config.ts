import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "uno",
  "displayName": "Uno",
  "version": "1.0.0",
  "extensions": [
    ".uno"
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
      "path": "src/demo.uno",
      "content": "public class Main { }\n"
    },
    {
      "path": "tests/run.uno",
      "content": "public class Main { }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "public class Main { }\n"
    }
  },
  "reference": "Uno syntax reference\n- Example: public class Main { }\n- Comment: //\n- No CLI runner configured"
}
