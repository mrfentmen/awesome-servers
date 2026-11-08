import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "edgeql",
  "displayName": "EdgeQL",
  "version": "1.0.0",
  "extensions": [
    ".edgeql",
    ".esdl"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "'",
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constraint",
      "pattern": "^\\s*constraint\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "runner": [
    {
      "command": "edgedb",
      "args": [
        "-f",
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "schema.esdl",
      "content": "module default {\n  type Person {\n    required name: str;\n  }\n}\n"
    },
    {
      "path": "tests/run.edgeql",
      "content": "select 2 + 2;\n"
    }
  ],
  "snippets": {
    "type": {
      "description": "type",
      "body": "type Name {\n  required value: str;\n}"
    },
    "query": {
      "description": "query",
      "body": "select Name { value };"
    },
    "function": {
      "description": "function",
      "body": "function name(value: str) -> str using (value);"
    }
  },
  "reference": "EdgeQL syntax reference\n- Module: module default { ... }\n- Type: type Name { required value: str; }\n- Property: required name: str;\n- Query: select Name { value };\n- Filter: select Name filter .value = 'x';\n- Insert: insert Name { value := 'x' };\n- Function: function name(value: str) -> str using (value);\n- Comment: # line\n- Run: edgedb -f file.edgeql"
}
