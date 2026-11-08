import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cap-cds",
  "displayName": "CAP CDS",
  "version": "1.0.0",
  "extensions": [
    ".cds"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "entity",
      "pattern": "^\\s*entity\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.cds",
      "content": "entity Books {\n  key ID : Integer;\n  title : String;\n}\n"
    },
    {
      "path": "tests/run.cds",
      "content": "entity Books {\n  key ID : Integer;\n  title : String;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "entity Books {\n  key ID : Integer;\n  title : String;\n}\n"
    }
  },
  "reference": "CAP CDS syntax reference\n- Example: entity Books {\n- Comment: //\n- Run: cds compile {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
