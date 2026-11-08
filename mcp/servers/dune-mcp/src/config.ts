import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dune",
  "displayName": "Dune",
  "version": "1.0.0",
  "extensions": [
    ".txt"
  ],
  "markers": [],
  "comment": ";",
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
      "path": "src/demo.txt",
      "content": "(executable (name main))\n"
    },
    {
      "path": "tests/run.txt",
      "content": "(executable (name main))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(executable (name main))\n"
    }
  },
  "reference": "Dune syntax reference\n- Example: (executable (name main))\n- Comment: ;\n- No CLI runner configured"
}
