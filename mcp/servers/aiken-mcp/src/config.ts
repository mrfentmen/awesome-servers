import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "aiken",
  "displayName": "Aiken",
  "version": "1.0.0",
  "extensions": [
    ".ak"
  ],
  "markers": [
    "aiken.toml"
  ],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "validator",
      "pattern": "^\\s*validator\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:pub\\s+)?fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:pub\\s+)?type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*(?:pub\\s+)?const\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z0-9_./{}]+)"
    }
  ],
  "build": [
    {
      "command": "aiken",
      "args": [
        "build"
      ]
    }
  ],
  "test": [
    {
      "command": "aiken",
      "args": [
        "check"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "aiken.toml",
      "content": "name = \"{{name}}\"\nversion = \"0.0.1\"\nplutus_version = \"v3\"\ncompiler = \"v1.1.0\"\n"
    },
    {
      "path": "lib/hello.ak",
      "content": "pub fn add(a: Int, b: Int) -> Int {\n  a + b\n}\n\ntest add_test() {\n  add(2, 2) == 4\n}\n"
    }
  ],
  "snippets": {
    "validator": {
      "description": "validator",
      "body": "validator name {\n  spend(_datum, _redeemer, _context) {\n    True\n  }\n}"
    },
    "function": {
      "description": "function",
      "body": "pub fn name(value: Int) -> Int {\n  value + 1\n}"
    },
    "test": {
      "description": "test",
      "body": "test name() {\n  2 + 2 == 4\n}"
    }
  },
  "reference": "Aiken syntax reference\n- Validator: validator name { spend(...) { True } }\n- Function: pub fn name(value: Int) -> Int { value }\n- Type: pub type Name { value: Int }\n- Constant: pub const NAME: Int = 1\n- Import: use aiken/list\n- Test: test name() { 2 + 2 == 4 }\n- Build: aiken build; check: aiken check"
}
