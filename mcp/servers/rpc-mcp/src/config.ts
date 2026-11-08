import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rpc",
  "displayName": "RPC",
  "version": "1.0.0",
  "extensions": [
    ".x"
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
      "path": "src/demo.x",
      "content": "program DEMO { version V1 { int ADD(int a, int b) = 1; } }\n"
    },
    {
      "path": "tests/run.x",
      "content": "program DEMO { version V1 { int ADD(int a, int b) = 1; } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "program DEMO { version V1 { int ADD(int a, int b) = 1; } }\n"
    }
  },
  "reference": "RPC syntax reference\n- Example: program DEMO { version V1 { int ADD(int a, int b) = 1; } }\n- Comment: //\n- No CLI runner configured"
}
