import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "codeql",
  "displayName": "CodeQL",
  "version": "1.0.0",
  "extensions": [
    ".ql",
    ".qll"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ql",
      "content": "class Person extends string {\n  string getName() { result = this }\n}\n"
    },
    {
      "path": "tests/run.ql",
      "content": "class Person extends string {\n  string getName() { result = this }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Person extends string {\n  string getName() { result = this }\n}\n"
    }
  },
  "reference": "CodeQL syntax reference\n- Example: class Person extends string {\n- Comment: //\n- Run: codeql query run {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
