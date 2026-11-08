import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mirc-script",
  "displayName": "mIRC Script",
  "version": "1.0.0",
  "extensions": [
    ".mrc"
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
      "path": "src/demo.mrc",
      "content": "on *:TEXT:!hello:*: { msg $chan Hello }\n"
    },
    {
      "path": "tests/run.mrc",
      "content": "on *:TEXT:!hello:*: { msg $chan Hello }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "on *:TEXT:!hello:*: { msg $chan Hello }\n"
    }
  },
  "reference": "mIRC Script syntax reference\n- Example: on *:TEXT:!hello:*: { msg $chan Hello }\n- Comment: ;\n- No CLI runner configured"
}
