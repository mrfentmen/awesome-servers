import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jai",
  "displayName": "Jai",
  "version": "1.0.0",
  "extensions": [
    ".jai"
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
      "kind": "procedure",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*::\\s*\\("
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
      "kind": "constant",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*::\\s*"
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*#load\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.jai",
      "content": "add :: (a: int, b: int) -> int {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.jai",
      "content": "test :: () -> bool {\n  return 2 + 2 == 4;\n}\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "name :: (value: int) -> int {\n  return value + 1;\n}"
    },
    "struct": {
      "description": "struct",
      "body": "Name :: struct {\n  value: int;\n}"
    },
    "load": {
      "description": "load",
      "body": "#load \"module.jai\""
    }
  },
  "reference": "Jai syntax reference\n- Procedure: name :: (value: int) -> int { return value + 1; }\n- Struct: Name :: struct { value: int; }\n- Enum: Name :: enum { VALUE; }\n- Constant: NAME :: 1\n- Variable: value := 1\n- Load: #load \"module.jai\"\n- Conditional: if condition { ... }\n- Loop: for 0..10 { ... }\n- Comment: // line; /* block */\n- Compile: jai file.jai"
}
