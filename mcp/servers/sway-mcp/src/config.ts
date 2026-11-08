import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sway",
  "displayName": "Sway",
  "version": "1.0.0",
  "extensions": [
    ".sw"
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
      "kind": "contract",
      "pattern": "^\\s*(?:contract|library|predicate|script)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
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
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_:]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/main.sw",
      "content": "contract Demo {\n    fn add(a: u64, b: u64) -> u64 {\n        a + b\n    }\n}\n"
    },
    {
      "path": "tests/run.sw",
      "content": "contract Test {\n    fn value() -> u64 {\n        4\n    }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name(value: u64) -> u64 {\n    value + 1\n}"
    },
    "contract": {
      "description": "contract",
      "body": "contract Name {\n}"
    },
    "struct": {
      "description": "struct",
      "body": "pub struct Name {\n    value: u64,\n}"
    }
  },
  "reference": "Sway syntax reference\n- Contract: contract Name { ... }\n- Library: library Name;\n- Function: fn name(value: u64) -> u64 { value + 1 }\n- Struct: pub struct Name { value: u64 }\n- Enum: pub enum Name { Value: u64 }\n- Use: use std::u64::*;\n- Variable: let name: u64 = 1;\n- Comment: // line; /* block */\n- Build: forc build"
}
