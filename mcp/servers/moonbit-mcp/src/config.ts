import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "moonbit",
  "displayName": "MoonBit",
  "version": "1.0.0",
  "extensions": [
    ".mbt"
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
      "pattern": "^\\s*(?:pub\\s+)?fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*(?:pub\\s+)?struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*(?:pub\\s+)?enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*(?:pub\\s+)?trait\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.mbt",
      "content": "fn add(a : Int, b : Int) -> Int {\n  a + b\n}\n"
    },
    {
      "path": "tests/run.mbt",
      "content": "test \"math\" {\n  assert_eq(2 + 2, 4)\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name(value : Int) -> Int {\n  value + 1\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n  value : Int\n}"
    },
    "test": {
      "description": "test",
      "body": "test \"name\" {\n  assert_eq(2 + 2, 4)\n}"
    }
  },
  "reference": "MoonBit syntax reference\n- Function: fn name(value : Int) -> Int { value + 1 }\n- Struct: struct Name { value : Int }\n- Enum: enum Name { Value(Int) }\n- Trait: trait Name { fn value(Self) -> Int }\n- Variable: let value = 1\n- Conditional: if condition { ... } else { ... }\n- Test: test \"name\" { assert_eq(2 + 2, 4) }\n- Import: import module\n- Comment: // line; /* block */\n- Build: moon build"
}
