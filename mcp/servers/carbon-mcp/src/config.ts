import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "carbon",
  "displayName": "Carbon",
  "version": "1.0.0",
  "extensions": [
    ".carbon"
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
      "kind": "function",
      "pattern": "^\\s*fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|struct|interface)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*var\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.carbon",
      "content": "package Demo api;\n\nfn Add(a: i32, b: i32) -> i32 {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.carbon",
      "content": "package Test api;\n\nfn Value() -> i32 {\n  return 2 + 2;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn Name(value: i32) -> i32 {\n  return value + 1;\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name {\n  var value: i32;\n}"
    },
    "package": {
      "description": "package",
      "body": "package Name api;"
    }
  },
  "reference": "Carbon syntax reference\n- Package: package Name api;\n- Function: fn Name(value: i32) -> i32 { return value + 1; }\n- Class: class Name { var value: i32; }\n- Struct: struct Name { var value: i32; }\n- Interface: interface Name { fn Value() -> i32; }\n- Variable: var value: i32 = 1;\n- Import: import Module;\n- Comment: // line; /* block */\n- Compile: carbon compile file.carbon"
}
