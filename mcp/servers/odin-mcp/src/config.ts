import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "odin",
  "displayName": "Odin",
  "version": "1.0.0",
  "extensions": [
    ".odin"
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
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*::\\s*proc"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*::\\s*struct"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*::\\s*enum"
    },
    {
      "kind": "union",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*::\\s*union"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_/]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.odin",
      "content": "package demo\n\nadd :: proc(a: int, b: int) -> int {\n    return a + b\n}\n"
    },
    {
      "path": "tests/run.odin",
      "content": "package run\n\nmain :: proc() {\n    assert(2 + 2 == 4)\n}\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "add :: proc(a: int, b: int) -> int {\n    return a + b\n}"
    },
    "struct": {
      "description": "struct",
      "body": "Name :: struct {\n    value: int,\n}"
    },
    "package": {
      "description": "package",
      "body": "package name"
    }
  },
  "reference": "Odin syntax reference\n- Package: package name\n- Procedure: add :: proc(a: int, b: int) -> int { return a + b }\n- Struct: Name :: struct { value: int }\n- Enum: Name :: enum { One, Two }\n- Union: Name :: union { int, string }\n- Import: import \"core:fmt\"\n- Declaration: value := 1\n- Comment: // line; /* block */\n- Build: odin build ."
}
