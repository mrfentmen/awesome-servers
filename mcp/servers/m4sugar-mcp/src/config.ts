import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "m4sugar",
  "displayName": "M4Sugar",
  "version": "1.0.0",
  "extensions": [
    ".m4"
  ],
  "markers": [],
  "comment": "dnl",
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
      "path": "src/demo.m4",
      "content": "AC_DEFUN([DEMO], [echo hello])\n"
    },
    {
      "path": "tests/run.m4",
      "content": "AC_DEFUN([DEMO], [echo hello])\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "AC_DEFUN([DEMO], [echo hello])\n"
    }
  },
  "reference": "M4Sugar syntax reference\n- Example: AC_DEFUN([DEMO], [echo hello])\n- Comment: dnl\n- No CLI runner configured"
}
