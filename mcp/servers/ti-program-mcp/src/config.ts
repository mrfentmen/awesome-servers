import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ti-program",
  "displayName": "TI Program",
  "version": "1.0.0",
  "extensions": [
    ".8xp"
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
      "path": "src/demo.8xp",
      "content": "Disp \"HELLO\"\n"
    },
    {
      "path": "tests/run.8xp",
      "content": "Disp \"HELLO\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Disp \"HELLO\"\n"
    }
  },
  "reference": "TI Program syntax reference\n- Example: Disp \"HELLO\"\n- Comment: //\n- No CLI runner configured"
}
