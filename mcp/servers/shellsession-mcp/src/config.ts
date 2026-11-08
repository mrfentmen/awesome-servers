import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "shellsession",
  "displayName": "ShellSession",
  "version": "1.0.0",
  "extensions": [
    ".sh-session"
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
      "path": "src/demo.sh-session",
      "content": "$ echo hello\n"
    },
    {
      "path": "tests/run.sh-session",
      "content": "$ echo hello\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "$ echo hello\n"
    }
  },
  "reference": "ShellSession syntax reference\n- Example: $ echo hello\n- Comment: #\n- No CLI runner configured"
}
