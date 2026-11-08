import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "squirrel",
  "displayName": "Squirrel",
  "version": "1.0.0",
  "extensions": [
    ".nut"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "local",
      "pattern": "^\\s*(?:local|const)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+\"([^\"]+)"
    },
    {
      "kind": "require",
      "pattern": "^\\s*require\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.nut",
      "content": "function add(a, b) {\n    return a + b;\n}\n\nprint(add(2, 2));\n"
    },
    {
      "path": "tests/run.nut",
      "content": "if (2 + 2 != 4) {\n    throw \"math failed\";\n}\nprint(\"ok\");\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(value) {\n    return value + 1;\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name {\n    value = 1;\n}"
    },
    "loop": {
      "description": "for loop",
      "body": "for (local i = 0; i < 10; i++) {\n    print(i);\n}"
    }
  },
  "reference": "Squirrel syntax reference\n- Function: function name(value) { return value + 1; }\n- Class: class Name { value = 1; }\n- Local: local value = 1;\n- Constant: const NAME = 1;\n- Conditional: if (condition) { ... } else { ... }\n- Loop: for (local i = 0; i < 10; i++) { ... }\n- Include: #include \"file.nut\"\n- Comment: // line; /* block */\n- Run: squirrel file.nut"
}
