import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pkl",
  "displayName": "Pkl",
  "version": "1.0.0",
  "extensions": [
    ".pkl"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "typealias",
      "pattern": "^\\s*typealias\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "command": "pkl",
      "args": [
        "eval",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "pkl",
      "args": [
        "eval",
        "tests/run.pkl"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.pkl",
      "content": "module {{name}}\nmessage = \"Hello from Pkl\"\n"
    },
    {
      "path": "tests/run.pkl",
      "content": "module tests\nvalue = 2 + 2\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module name\nmessage = \"Hello\""
    },
    "class": {
      "description": "class",
      "body": "class Name {\n  name: String\n}"
    },
    "function": {
      "description": "function",
      "body": "function name(value: String): String = value"
    }
  },
  "reference": "Pkl syntax reference\n- Module: module name\n- Class: class Name { name: String }\n- Property: name = \"value\"\n- Function: function name(value: String): String = value\n- Type alias: typealias Name = String\n- Import: import \"path.pkl\"\n- Condition: if (value) { ... } else { ... }\n- Evaluate: pkl eval file.pkl"
}
