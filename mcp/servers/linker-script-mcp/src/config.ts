import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "linker-script",
  "displayName": "Linker Script",
  "version": "1.0.0",
  "extensions": [
    ".ld",
    ".lds",
    ".x"
  ],
  "markers": [],
  "comment": "/*",
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
      "path": "src/demo.ld",
      "content": "SECTIONS { .text : { *(.text) } }\n"
    },
    {
      "path": "tests/run.ld",
      "content": "SECTIONS { .text : { *(.text) } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "SECTIONS { .text : { *(.text) } }\n"
    }
  },
  "reference": "Linker Script syntax reference\n- Example: SECTIONS { .text : { *(.text) } }\n- Comment: /*\n- No CLI runner configured"
}
