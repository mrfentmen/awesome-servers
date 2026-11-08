import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jison",
  "displayName": "Jison",
  "version": "1.0.0",
  "extensions": [
    ".jison"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "rule",
      "pattern": "^([A-Za-z_]\\w*)\\s*:"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.jison",
      "content": "%lex\n%%\n\\s+ /* skip */\n%%\n%start expressions\n%%\nexpressions:\n    e EOF { return $1; }\n;\n"
    },
    {
      "path": "tests/run.jison",
      "content": "%lex\n%%\n\\s+ /* skip */\n%%\n%start expressions\n%%\nexpressions:\n    e EOF { return $1; }\n;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "%lex\n%%\n\\s+ /* skip */\n%%\n%start expressions\n%%\nexpressions:\n    e EOF { return $1; }\n;\n"
    }
  },
  "reference": "Jison syntax reference\n- Example: %lex\n- Comment: //\n- Run: jison {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
