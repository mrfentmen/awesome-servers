import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dtrace",
  "displayName": "DTrace",
  "version": "1.0.0",
  "extensions": [
    ".d"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "probe",
      "pattern": "^([A-Za-z_]\\w*)\\s*$"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.d",
      "content": "BEGIN\n{\n  printf(\"%d\", 2 + 2);\n}\n"
    },
    {
      "path": "tests/run.d",
      "content": "BEGIN\n{\n  printf(\"%d\", 2 + 2);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "BEGIN\n{\n  printf(\"%d\", 2 + 2);\n}\n"
    }
  },
  "reference": "DTrace syntax reference\n- Example: BEGIN\n- Comment: //\n- Run: dtrace -s {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
