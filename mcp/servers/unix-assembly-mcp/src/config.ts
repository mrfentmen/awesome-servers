import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "unix-assembly",
  "displayName": "Unix Assembly",
  "version": "1.0.0",
  "extensions": [
    ".s",
    ".ms"
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
      "path": "src/demo.s",
      "content": ".globl _start\n_start: ret\n"
    },
    {
      "path": "tests/run.s",
      "content": ".globl _start\n_start: ret\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ".globl _start\n_start: ret\n"
    }
  },
  "reference": "Unix Assembly syntax reference\n- Example: .globl _start\n- Comment: #\n- No CLI runner configured"
}
