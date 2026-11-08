import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "func",
  "displayName": "FunC",
  "version": "1.0.0",
  "extensions": [
    ".fc"
  ],
  "markers": [],
  "comment": ";;",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:\\(\\)|\\([^)]*\\))\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "global",
      "pattern": "^\\s*global\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.fc",
      "content": "() add(int a, int b) impure {\n    return a + b;\n}\n"
    },
    {
      "path": "tests/run.fc",
      "content": "() add(int a, int b) impure {\n    return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "() value(int a) impure {\n    return a + 1;\n}"
    }
  },
  "reference": "FunC syntax reference\n- Function: () value(int a) impure { return a + 1; }\n- Global: global int value;\n- Include: #include \"stdlib.fc\";\n- Variable: int value = 1;\n- Conditional: if (condition) { ... }\n- Loop: while (condition) { ... }\n- Comment: ;; line\n- Compile: func file.fc"
}
