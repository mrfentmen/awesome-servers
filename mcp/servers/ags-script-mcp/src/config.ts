import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ags-script",
  "displayName": "AGS Script",
  "version": "1.0.0",
  "extensions": [
    ".asc",
    ".ash"
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
      "kind": "struct",
      "pattern": "^\\s*(?:managed\\s+)?struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "event",
      "pattern": "^\\s*event\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "scripts/hello.asc",
      "content": "function add(int a, int b) {\n  return a + b;\n}\n"
    },
    {
      "path": "scripts/test.asc",
      "content": "function test_add() {\n  if (add(2, 2) != 4) {\n    Display(\"bad\");\n  }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(int value) {\n  return value + 1;\n}"
    },
    "struct": {
      "description": "struct",
      "body": "managed struct Name {\n  int value;\n}"
    },
    "event": {
      "description": "event",
      "body": "event Name(int value);"
    }
  },
  "reference": "AGS Script syntax reference\n- Function: function name(int value) { return value + 1; }\n- Struct: managed struct Name { int value; }\n- Enum: enum Name { ONE, TWO }\n- Event: event Name(int value);\n- Variable: int value = 1;\n- Condition: if (value > 0) { ... }\n- Loop: while (value < 10) { ... }\n- Import: import name;\n- Comment: // line; /* block */"
}
