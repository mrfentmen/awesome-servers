import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nickel",
  "displayName": "Nickel",
  "version": "1.0.0",
  "extensions": [
    ".ncl"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "binding",
      "pattern": "^\\s*let\\s+([A-Za-z_][A-Za-z0-9_-]*)\\s*="
    },
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "field",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_-]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "import\\s+\"([^\"]+)\""
    }
  ],
  "runner": [
    {
      "command": "nickel",
      "args": [
        "export",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "nickel",
      "args": [
        "typecheck",
        "."
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.ncl",
      "content": "{ message = \"Hello from Nickel\" }\n"
    },
    {
      "path": "tests/run.ncl",
      "content": "{ value = 2 + 2 }\n"
    }
  ],
  "snippets": {
    "record": {
      "description": "record",
      "body": "{ name = \"value\", count = 1 }"
    },
    "binding": {
      "description": "let binding",
      "body": "let name = value in name"
    },
    "function": {
      "description": "function",
      "body": "fun name => name"
    }
  },
  "reference": "Nickel syntax reference\n- Record: { name = \"value\", count = 1 }\n- Let: let name = value in body\n- Function: fun name => body\n- Array: [1, 2, 3]\n- Contract: value | String\n- Import: import \"file.ncl\"\n- Merge: left & right\n- Export: nickel export file.ncl"
}
