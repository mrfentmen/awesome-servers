import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "grace",
  "displayName": "Grace",
  "version": "1.0.0",
  "extensions": [
    ".grace"
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
      "kind": "method",
      "pattern": "^\\s*method\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "def",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.grace",
      "content": "method add(a, b) {\n    a + b\n}\n\nprint(add(2, 2))\n"
    },
    {
      "path": "tests/run.grace",
      "content": "if (2 + 2 != 4) then {\n    error \"math failed\"\n}\nprint(\"ok\")\n"
    }
  ],
  "snippets": {
    "method": {
      "description": "method",
      "body": "method name(value) {\n    value + 1\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name {\n    var value := 1\n}"
    },
    "type": {
      "description": "type",
      "body": "type Name = Number"
    }
  },
  "reference": "Grace syntax reference\n- Method: method name(value) { value + 1 }\n- Class: class Name { var value := 1 }\n- Type: type Name = Number\n- Def: def name = 1\n- Variable: var name := 1\n- Conditional: if (condition) then { ... }\n- Import: import \"module\"\n- Comment: // line; /* block */\n- Run: grace file.grace"
}
