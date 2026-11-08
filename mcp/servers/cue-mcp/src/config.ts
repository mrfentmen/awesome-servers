import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cue",
  "displayName": "CUE",
  "version": "1.0.0",
  "extensions": [
    ".cue"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "definition",
      "pattern": "^\\s*#([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "field",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)\""
    }
  ],
  "runner": [
    {
      "command": "cue",
      "args": [
        "eval",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "cue",
      "args": [
        "vet",
        "."
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.cue",
      "content": "package main\nmessage: \"Hello from CUE\"\n"
    },
    {
      "path": "tests/run.cue",
      "content": "package tests\nvalue: 2 + 2\n"
    }
  ],
  "snippets": {
    "package": {
      "description": "package",
      "body": "package name\nfield: \"value\""
    },
    "definition": {
      "description": "definition",
      "body": "#Name: {\n  field: string\n}"
    },
    "constraint": {
      "description": "constraint",
      "body": "value: >0 & <10"
    }
  },
  "reference": "CUE syntax reference\n- Package: package name\n- Field: name: value\n- Definition: #Name: { field: string }\n- Constraint: value: >0 & <10\n- Optional field: name?: string\n- List: [1, 2, 3]\n- Import: import \"path\"\n- Evaluate: cue eval file.cue"
}
