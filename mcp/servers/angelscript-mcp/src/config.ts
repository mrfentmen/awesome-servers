import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "angelscript",
  "displayName": "AngelScript",
  "version": "1.0.0",
  "extensions": [
    ".as",
    ".angelscript"
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
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:void|int|float|double|bool|string)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "funcdef",
      "pattern": "^\\s*funcdef\\s+[A-Za-z_][A-Za-z0-9_]*\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "scripts/hello.as",
      "content": "class Demo {\n  int add(int a, int b) {\n    return a + b;\n  }\n}\n"
    },
    {
      "path": "scripts/test.as",
      "content": "void main() {\n  int value = 2 + 2;\n  assert(value == 4);\n}\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "class Name {\n  int value;\n\n  int get() const { return value; }\n}"
    },
    "function": {
      "description": "function",
      "body": "int name(int value) {\n  return value + 1;\n}"
    },
    "interface": {
      "description": "interface",
      "body": "interface IName {\n  int get() const;\n}"
    }
  },
  "reference": "AngelScript syntax reference\n- Class: class Name { int value; }\n- Function: int name(int value) { return value + 1; }\n- Interface: interface IName { int get() const; }\n- Funcdef: funcdef void Callback();\n- Variable: int value = 1;\n- Condition: if (value > 0) { ... }\n- Loop: for (int i = 0; i < 10; i++) { ... }\n- Include: #include \"file.as\"\n- Comment: // line; /* block */"
}
