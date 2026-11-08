import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ucode",
  "displayName": "ucode",
  "version": "1.0.0",
  "extensions": [
    ".uc"
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
      "path": "src/demo.uc",
      "content": "let x = 1;\n"
    },
    {
      "path": "tests/run.uc",
      "content": "let x = 1;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let x = 1;\n"
    }
  },
  "reference": "ucode syntax reference\n- Example: let x = 1;\n- Comment: //\n- No CLI runner configured"
}
