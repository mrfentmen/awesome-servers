import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "parrot",
  "displayName": "Parrot",
  "version": "1.0.0",
  "extensions": [
    ".parrot"
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
      "path": "src/demo.parrot",
      "content": ".sub main\n  say \"hello\"\n.end\n"
    },
    {
      "path": "tests/run.parrot",
      "content": ".sub main\n  say \"hello\"\n.end\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ".sub main\n  say \"hello\"\n.end\n"
    }
  },
  "reference": "Parrot syntax reference\n- Example: .sub main\n- Comment: #\n- No CLI runner configured"
}
