import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mako",
  "displayName": "Mako",
  "version": "1.0.0",
  "extensions": [
    ".mako",
    ".mao"
  ],
  "markers": [],
  "comment": "##",
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
      "path": "src/demo.mako",
      "content": "<%def name=\"demo()\">hello</%def>\n"
    },
    {
      "path": "tests/run.mako",
      "content": "<%def name=\"demo()\">hello</%def>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<%def name=\"demo()\">hello</%def>\n"
    }
  },
  "reference": "Mako syntax reference\n- Example: <%def name=\"demo()\">hello</%def>\n- Comment: ##\n- No CLI runner configured"
}
