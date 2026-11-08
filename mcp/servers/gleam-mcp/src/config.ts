import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gleam",
  "displayName": "Gleam",
  "version": "1.0.0",
  "extensions": [
    ".gleam"
  ],
  "markers": [
    "gleam.toml"
  ],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:pub\\s+)?fn\\s+([a-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:pub\\s+)?type\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*(?:pub\\s+)?const\\s+([a-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([a-z_][A-Za-z0-9_/]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.gleam",
      "content": "pub fn add(a: Int, b: Int) -> Int {\n  a + b\n}\n"
    },
    {
      "path": "test/run_test.gleam",
      "content": "pub fn value() -> Int {\n  2 + 2\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "pub fn name(value: Int) -> Int {\n  value + 1\n}"
    },
    "type": {
      "description": "type",
      "body": "pub type Name {\n  One\n  Two\n}"
    },
    "import": {
      "description": "import",
      "body": "import gleam/io"
    }
  },
  "reference": "Gleam syntax reference\n- Function: pub fn name(value: Int) -> Int { value + 1 }\n- Type: pub type Name { One Two }\n- Constant: pub const name = 1\n- Import: import gleam/io\n- Case: case value { 1 -> one; _ -> other }\n- Result: Ok(value) / Error(reason)\n- Comment: // line\n- Build: gleam build"
}
