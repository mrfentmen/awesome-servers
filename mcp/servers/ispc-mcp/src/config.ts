import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ispc",
  "displayName": "ISPC",
  "version": "1.0.0",
  "extensions": [
    ".ispc"
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
      "kind": "export",
      "pattern": "^\\s*export\\s+void\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "task",
      "pattern": "^\\s*task\\s+void\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:void|int|float|double)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s*[<\"]([^>\"]+)[>\"]"
    }
  ],
  "scaffold": [
    {
      "path": "src/hello.ispc",
      "content": "export void hello(uniform int value[], uniform int count) {\n  foreach (index = 0 ... count) {\n    value[index] = index;\n  }\n}\n"
    },
    {
      "path": "tests/run.ispc",
      "content": "export void test(uniform int value[]) {\n  value[0] = 2 + 2;\n}\n"
    }
  ],
  "snippets": {
    "export": {
      "description": "export function",
      "body": "export void name(uniform int value) {\n}"
    },
    "task": {
      "description": "task",
      "body": "task void name(uniform int value) {\n}"
    },
    "foreach": {
      "description": "foreach",
      "body": "foreach (index = 0 ... count) {\n  value[index] = index;\n}"
    }
  },
  "reference": "ISPC syntax reference\n- Export: export void name(uniform int value) { ... }\n- Task: task void name(uniform int value) { ... }\n- Uniform: uniform int value\n- Varying: varying float value\n- Foreach: foreach (index = 0 ... count) { ... }\n- Struct: struct Name { int value; };\n- Include: #include \"file.ispc\"\n- Comment: // line; /* block */\n- Compile: ispc file.ispc"
}
