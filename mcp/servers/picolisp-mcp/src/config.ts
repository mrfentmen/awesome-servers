import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "picolisp",
  "displayName": "PicoLisp",
  "version": "1.0.0",
  "extensions": [
    ".l"
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
      "path": "src/demo.l",
      "content": "(de add (A B) (+ A B))\n"
    },
    {
      "path": "tests/run.l",
      "content": "(de add (A B) (+ A B))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(de add (A B) (+ A B))\n"
    }
  },
  "reference": "PicoLisp syntax reference\n- Example: (de add (A B) (+ A B))\n- Comment: #\n- No CLI runner configured"
}
