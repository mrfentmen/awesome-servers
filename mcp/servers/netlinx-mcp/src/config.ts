import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "netlinx",
  "displayName": "NetLinx",
  "version": "1.0.0",
  "extensions": [
    ".axs",
    ".axi"
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
      "path": "src/demo.axs",
      "content": "PROGRAM_NAME='Demo'\n"
    },
    {
      "path": "tests/run.axs",
      "content": "PROGRAM_NAME='Demo'\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "PROGRAM_NAME='Demo'\n"
    }
  },
  "reference": "NetLinx syntax reference\n- Example: PROGRAM_NAME='Demo'\n- Comment: '\n- No CLI runner configured"
}
