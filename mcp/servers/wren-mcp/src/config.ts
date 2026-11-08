import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "wren",
  "displayName": "Wren",
  "version": "1.0.0",
  "extensions": [
    ".wren"
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
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*(?:static\\s+)?([A-Za-z_][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*\\{"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:var|foreign)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.wren",
      "content": "class Demo {\n  static add(a, b) { a + b }\n}\n\nSystem.print(Demo.add(2, 2))\n"
    },
    {
      "path": "tests/run.wren",
      "content": "if (2 + 2 != 4) Fiber.abort(\"math failed\")\nSystem.print(\"ok\")\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "class Name {\n  construct new(value) { _value = value }\n}"
    },
    "method": {
      "description": "method",
      "body": "name(value) { value + 1 }"
    },
    "loop": {
      "description": "for loop",
      "body": "for (i in 1..10) {\n  System.print(i)\n}"
    }
  },
  "reference": "Wren syntax reference\n- Class: class Name { construct new(value) { _value = value } }\n- Method: name(value) { value + 1 }\n- Static method: static name(value) { value + 1 }\n- Variable: var name = 1\n- Conditional: if (condition) { ... } else { ... }\n- Loop: for (i in 1..10) { ... }\n- Import: import \"module\" for Name\n- Comment: // line; /* block */\n- Run: wren file.wren"
}
