import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "kcl",
  "displayName": "KCL",
  "version": "1.0.0",
  "extensions": [
    ".k"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "schema",
      "pattern": "^\\s*schema\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "rule",
      "pattern": "^\\s*rule\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.k",
      "content": "schema Demo {\n  value: int = 2\n}\n\ndemo = Demo { value = 2 }\n"
    },
    {
      "path": "tests/run.k",
      "content": "value = 2 + 2\nassert value == 4\n"
    }
  ],
  "snippets": {
    "schema": {
      "description": "schema",
      "body": "schema Name {\n  value: int = 1\n}"
    },
    "variable": {
      "description": "variable",
      "body": "name = 1"
    },
    "rule": {
      "description": "rule",
      "body": "rule check {\n  value > 0\n}"
    }
  },
  "reference": "KCL syntax reference\n- Schema: schema Name { value: int = 1 }\n- Variable: name = 1\n- Rule: rule check { value > 0 }\n- Import: import module\n- Assert: assert value == 4\n- Conditional: if condition { ... } else { ... }\n- List: values = [1, 2, 3]\n- Comment: # line\n- Run: kcl file.k"
}
