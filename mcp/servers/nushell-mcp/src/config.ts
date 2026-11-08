import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nushell",
  "displayName": "Nushell",
  "version": "1.0.0",
  "extensions": [
    ".nu"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:let|mut)\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z0-9_./-]+)"
    },
    {
      "kind": "source",
      "pattern": "^\\s*source\\s+([^\\s]+)"
    }
  ],
  "runner": [
    {
      "command": "nu",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "nu",
      "args": [
        "tests/run.nu"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "hello.nu",
      "content": "def main [] { print \"Hello from Nushell\" }\nmain\n"
    },
    {
      "path": "tests/run.nu",
      "content": "if 2 + 2 == 4 { print \"ok\" } else { error make { msg: \"bad math\" } }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def name [value: string] { print $value }"
    },
    "variable": {
      "description": "variable",
      "body": "let value = 42"
    },
    "table": {
      "description": "table",
      "body": "[[name value]; [Bond 7]]"
    }
  },
  "reference": "Nushell syntax reference\n- Function: def name [value: string] { print $value }\n- Variable: let value = 42; mut value = 42\n- Alias: alias name = command\n- Module: module name { ... }\n- Import: use path/to/module.nu\n- Pipeline: ls | where size > 1kb\n- Table: [[name value]; [Bond 7]]\n- Comment: # line\n- Run: nu script.nu"
}
