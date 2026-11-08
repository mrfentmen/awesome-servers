import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "javascript-erb",
  "displayName": "JavaScript+ERB",
  "version": "1.0.0",
  "extensions": [
    ".js.erb"
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
      "path": "src/demo.js.erb",
      "content": "<% const x = 1; %>\n"
    },
    {
      "path": "tests/run.js.erb",
      "content": "<% const x = 1; %>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<% const x = 1; %>\n"
    }
  },
  "reference": "JavaScript+ERB syntax reference\n- Example: <% const x = 1; %>\n- Comment: //\n- No CLI runner configured"
}
