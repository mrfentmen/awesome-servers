import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dafny",
  "displayName": "Dafny",
  "version": "1.0.0",
  "extensions": [
    ".dfy"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "method",
      "pattern": "^\\s*method\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "datatype",
      "pattern": "^\\s*datatype\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "predicate",
      "pattern": "^\\s*predicate\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "build": [
    {
      "command": "dafny",
      "args": [
        "verify",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "dafny",
      "args": [
        "test",
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "src/hello.dfy",
      "content": "method Main() {\n  assert 2 + 2 == 4;\n}\n\nmethod Add(a: int, b: int) returns (sum: int)\n  ensures sum == a + b\n{\n  sum := a + b;\n}\n"
    }
  ],
  "snippets": {
    "method": {
      "description": "method",
      "body": "method Name(value: int) returns (result: int)\n  ensures result >= 0\n{\n  result := value;\n}"
    },
    "function": {
      "description": "function",
      "body": "function Name(value: int): int {\n  value + 1\n}"
    },
    "lemma": {
      "description": "lemma",
      "body": "lemma Name(value: int)\n  ensures value == value\n{\n}"
    }
  },
  "reference": "Dafny syntax reference\n- Method: method Name(value: int) returns (result: int) { ... }\n- Function: function Name(value: int): int { value + 1 }\n- Predicate: predicate Name(value: int) { value > 0 }\n- Lemma: lemma Name(value: int) ensures ... { }\n- Class: class Name { ... }\n- Datatype: datatype Name = A | B\n- Module: module Name { ... }\n- Import: import Name\n- Verify: dafny verify file.dfy; test: dafny test file.dfy"
}
