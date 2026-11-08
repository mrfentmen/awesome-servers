import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dhall",
  "displayName": "Dhall",
  "version": "1.0.0",
  "extensions": [
    ".dhall"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "{-",
    "end": "-}"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "binding",
      "pattern": "^\\s*let\\s+([A-Za-z_][A-Za-z0-9_-]*)\\s*="
    },
    {
      "kind": "field",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "remote",
      "pattern": "(https://[^\\s]+)"
    },
    {
      "kind": "environment",
      "pattern": "(env:[A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "local",
      "pattern": "(\\.{1,2}/[^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "dhall",
      "args": [
        "--file",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "dhall",
      "args": [
        "--file",
        "tests/run.dhall"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.dhall",
      "content": "let greeting = \"Hello from Dhall\"\nin greeting\n"
    },
    {
      "path": "tests/run.dhall",
      "content": "let result = 2 + 2\nin result\n"
    }
  ],
  "snippets": {
    "binding": {
      "description": "let binding",
      "body": "let name = value\nin name"
    },
    "record": {
      "description": "record",
      "body": "{ name = \"value\", count = 1 }"
    },
    "function": {
      "description": "function",
      "body": "\\(name : Text) -> name"
    }
  },
  "reference": "Dhall syntax reference\n- Let: let name = value in body\n- Function: \\(name : Text) -> body\n- Record: { name = \"value\", count = 1 }\n- Union: < Left : Text | Right : Natural >\n- List: [ 1, 2, 3 ]\n- Import: ./file.dhall, env:NAME, https://example.com/file.dhall\n- Merge: merge handlers union\n- Run: dhall --file file.dhall"
}
