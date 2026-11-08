import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "vcl",
  "displayName": "VCL",
  "version": "1.0.0",
  "extensions": [
    ".vcl"
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
      "path": "src/demo.vcl",
      "content": "vcl 4.1; backend default { .host = \"127.0.0.1\"; }\n"
    },
    {
      "path": "tests/run.vcl",
      "content": "vcl 4.1; backend default { .host = \"127.0.0.1\"; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "vcl 4.1; backend default { .host = \"127.0.0.1\"; }\n"
    }
  },
  "reference": "VCL syntax reference\n- Example: vcl 4.1; backend default { .host = \"127.0.0.1\"; }\n- Comment: #\n- No CLI runner configured"
}
