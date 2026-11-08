import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "kakounescript",
  "displayName": "KakouneScript",
  "version": "1.0.0",
  "extensions": [
    ".kak"
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
      "path": "src/demo.kak",
      "content": "define-command demo %{ echo hello }\n"
    },
    {
      "path": "tests/run.kak",
      "content": "define-command demo %{ echo hello }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "define-command demo %{ echo hello }\n"
    }
  },
  "reference": "KakouneScript syntax reference\n- Example: define-command demo %{ echo hello }\n- Comment: #\n- No CLI runner configured"
}
