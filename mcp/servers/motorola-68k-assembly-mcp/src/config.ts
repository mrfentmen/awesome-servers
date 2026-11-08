import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "motorola-68k-assembly",
  "displayName": "Motorola 68K Assembly",
  "version": "1.0.0",
  "extensions": [
    ".asm",
    ".i",
    ".inc",
    ".s",
    ".x68"
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
      "path": "src/demo.asm",
      "content": "move.l #1,d0\nrts\n"
    },
    {
      "path": "tests/run.asm",
      "content": "move.l #1,d0\nrts\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "move.l #1,d0\nrts\n"
    }
  },
  "reference": "Motorola 68K Assembly syntax reference\n- Example: move.l #1,d0\n- Comment: ;\n- No CLI runner configured"
}
