import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jflex",
  "displayName": "JFlex",
  "version": "1.0.0",
  "extensions": [
    ".flex",
    ".jflex"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^%class\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.flex",
      "content": "%%\n%class Lexer\n%unicode\n%%\n[0-9]+ { return 1; }\n"
    },
    {
      "path": "tests/run.flex",
      "content": "%%\n%class Lexer\n%unicode\n%%\n[0-9]+ { return 1; }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%%\n%class Lexer\n%unicode\n%%\n[0-9]+ { return 1; }\n"
    }
  },
  "reference": "JFlex syntax reference\n- Example: %%\n- Comment: //\n- Run: jflex {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
