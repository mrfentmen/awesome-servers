import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xs",
  "displayName": "XS",
  "version": "1.0.0",
  "extensions": [
    ".xs"
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
      "path": "src/demo.xs",
      "content": "MODULE = Demo PACKAGE = Demo\n"
    },
    {
      "path": "tests/run.xs",
      "content": "MODULE = Demo PACKAGE = Demo\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MODULE = Demo PACKAGE = Demo\n"
    }
  },
  "reference": "XS syntax reference\n- Example: MODULE = Demo PACKAGE = Demo\n- Comment: //\n- No CLI runner configured"
}
