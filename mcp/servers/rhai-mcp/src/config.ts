import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "rhai",
  "displayName": "Rhai",
  "version": "1.0.0",
  "extensions": [
    ".rhai"
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
      "pattern": "^\\s*fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:let|const)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*(?:struct|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.rhai",
      "content": "fn add(a, b) {\n    a + b\n}\n\nprint(add(2, 2));\n"
    },
    {
      "path": "tests/run.rhai",
      "content": "if 2 + 2 != 4 {\n    throw \"math failed\";\n}\nprint(\"ok\");\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name(value) {\n    value + 1\n}"
    },
    "variable": {
      "description": "variable",
      "body": "let name = 1;"
    },
    "loop": {
      "description": "for loop",
      "body": "for i in 1..10 {\n    print(i);\n}"
    }
  },
  "reference": "Rhai syntax reference\n- Function: fn name(value) { value + 1 }\n- Variable: let name = 1;\n- Constant: const NAME = 1;\n- Conditional: if condition { ... } else { ... }\n- Loop: for i in 1..10 { ... }\n- Struct: struct Name { value: int }\n- Import: import \"module\" as name;\n- Comment: // line; /* block */\n- Run: rhai file.rhai"
}
