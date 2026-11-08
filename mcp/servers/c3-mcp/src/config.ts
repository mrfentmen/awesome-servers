import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "c3",
  "displayName": "C3",
  "version": "1.0.0",
  "extensions": [
    ".c3"
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
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*fn\\s+(?:[A-Za-z_][A-Za-z0-9_*]*\\s+)?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*(?:struct|union|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "fault",
      "pattern": "^\\s*fault\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.c3",
      "content": "module demo;\n\nfn int add(int a, int b) {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.c3",
      "content": "module run;\n\nfn int main() {\n  return 2 + 2 == 4 ? 0 : 1;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn int name(int value) {\n  return value + 1;\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n  int value;\n}"
    },
    "module": {
      "description": "module",
      "body": "module name;"
    }
  },
  "reference": "C3 syntax reference\n- Module: module name;\n- Function: fn int name(int value) { return value + 1; }\n- Struct: struct Name { int value; }\n- Enum: enum Name { VALUE }\n- Fault: fault Name;\n- Variable: int value = 1;\n- Conditional: if (condition) { ... }\n- Import: import module;\n- Comment: // line; /* block */\n- Compile: c3c compile file.c3"
}
