import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "netlinx-erb",
  "displayName": "NetLinx+ERB",
  "version": "1.0.0",
  "extensions": [
    ".axs.erb",
    ".axi.erb"
  ],
  "markers": [],
  "comment": "'",
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
      "path": "src/demo.axs.erb",
      "content": "<%# comment %>\n"
    },
    {
      "path": "tests/run.axs.erb",
      "content": "<%# comment %>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<%# comment %>\n"
    }
  },
  "reference": "NetLinx+ERB syntax reference\n- Example: <%# comment %>\n- Comment: '\n- No CLI runner configured"
}
