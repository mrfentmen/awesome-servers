import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "eclipse",
  "displayName": "ECLiPSe",
  "version": "1.0.0",
  "extensions": [
    ".ecl"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "predicate",
      "pattern": "^([a-z][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ecl",
      "content": ":- module(demo).\nadd(A, B, C) :- C is A + B.\n"
    },
    {
      "path": "tests/run.ecl",
      "content": ":- module(demo).\nadd(A, B, C) :- C is A + B.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": ":- module(demo).\nadd(A, B, C) :- C is A + B.\n"
    }
  },
  "reference": "ECLiPSe syntax reference\n- Example: :- module(demo).\n- Comment: %\n- Run: eclipse -f {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
