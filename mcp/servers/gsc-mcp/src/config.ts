import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gsc",
  "displayName": "GSC",
  "version": "1.0.0",
  "extensions": [
    ".gsc",
    ".csc",
    ".gsh"
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
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "main",
      "pattern": "^\\s*main\\s*\\("
    },
    {
      "kind": "define",
      "pattern": "^\\s*#define\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+([A-Za-z_][A-Za-z0-9_.\\/-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "scripts/demo.gsc",
      "content": "function add(a, b)\n{\n    return a + b;\n}\n"
    },
    {
      "path": "tests/run.gsc",
      "content": "main()\n{\n    return 2 + 2;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(value)\n{\n    return value + 1;\n}"
    },
    "main": {
      "description": "main",
      "body": "main()\n{\n}"
    },
    "include": {
      "description": "include",
      "body": "#include maps/mp/_utility;"
    }
  },
  "reference": "GSC syntax reference\n- Function: function name(value) { return value + 1; }\n- Main: main() { ... }\n- Define: #define NAME 1\n- Include: #include maps/mp/_utility;\n- Variable: value = 1;\n- Conditional: if (condition) { ... }\n- Loop: for (i = 0; i < 10; i++) { ... }\n- Comment: // line; /* block */\n- Compile: gsc-tool file.gsc"
}
