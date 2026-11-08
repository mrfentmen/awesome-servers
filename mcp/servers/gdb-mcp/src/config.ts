import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gdb",
  "displayName": "GDB",
  "version": "1.0.0",
  "extensions": [
    ".gdb",
    ".gdbinit"
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
      "path": "src/demo.gdb",
      "content": "break main\nrun\n"
    },
    {
      "path": "tests/run.gdb",
      "content": "break main\nrun\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "break main\nrun\n"
    }
  },
  "reference": "GDB syntax reference\n- Example: break main\n- Comment: #\n- No CLI runner configured"
}
