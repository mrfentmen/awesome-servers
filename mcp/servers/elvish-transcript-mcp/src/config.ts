import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "elvish-transcript",
  "displayName": "Elvish Transcript",
  "version": "1.0.0",
  "extensions": [
    ".txt"
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
      "path": "src/demo.txt",
      "content": "~> echo hello\n"
    },
    {
      "path": "tests/run.txt",
      "content": "~> echo hello\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "~> echo hello\n"
    }
  },
  "reference": "Elvish Transcript syntax reference\n- Example: ~> echo hello\n- Comment: #\n- No CLI runner configured"
}
