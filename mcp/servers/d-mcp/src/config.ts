import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "d",
  "displayName": "D",
  "version": "1.0.0",
  "extensions": [
    ".d",
    ".di"
  ],
  "markers": [
    "dub.json",
    "dub.sdl"
  ],
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
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_.]*)"
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
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:void|int|long|double|bool|string|auto)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
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
      "path": "source/demo.d",
      "content": "module demo;\n\nvoid greet() {\n}\n\nvoid main() {\n    greet();\n}\n"
    },
    {
      "path": "tests/run.d",
      "content": "module run;\n\nvoid main() {\n    assert(2 + 2 == 4);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int name(int value) {\n    return value + 1;\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n    int value;\n}"
    },
    "module": {
      "description": "module",
      "body": "module name;"
    }
  },
  "reference": "D syntax reference\n- Module: module name;\n- Function: int name(int value) { return value + 1; }\n- Class: class Name { int value; }\n- Struct: struct Name { int value; }\n- Interface: interface Name { void run(); }\n- Import: import std.stdio;\n- Immutable: immutable name = value;\n- Comment: // line; /* block */\n- Build: dmd file.d"
}
