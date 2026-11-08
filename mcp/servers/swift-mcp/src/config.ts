import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "swift",
  "displayName": "Swift",
  "version": "1.0.0",
  "extensions": [
    ".swift"
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
      "kind": "function",
      "pattern": "^\\s*func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "protocol",
      "pattern": "^\\s*protocol\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "runner": [
    {
      "command": "swift",
      "args": [
        "{file}"
      ],
      "timeoutMs": 90000
    }
  ],
  "test": [
    {
      "command": "swift",
      "args": [
        "tests/run.swift"
      ],
      "timeoutMs": 90000
    }
  ],
  "scaffold": [
    {
      "path": "Sources/Demo.swift",
      "content": "struct Demo {\n    static func greet() {\n        print(\"Hello from Swift\")\n    }\n}\n\nDemo.greet()\n"
    },
    {
      "path": "tests/run.swift",
      "content": "if 2 + 2 != 4 { fatalError(\"math failed\") }\nprint(\"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "func name(value: Int) -> Int {\n    value + 1\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n    let value: Int\n}"
    },
    "protocol": {
      "description": "protocol",
      "body": "protocol Name {\n    func run()\n}"
    }
  },
  "reference": "Swift syntax reference\n- Function: func name(value: Int) -> Int { value + 1 }\n- Variable: let name = value; var name = value\n- Struct: struct Name { let value: Int }\n- Class: class Name: Parent { ... }\n- Enum: enum Name { case one, two }\n- Protocol: protocol Name { func run() }\n- Extension: extension Name { ... }\n- Import: import Foundation\n- Comment: // line; /* block */\n- Run: swift file.swift"
}
