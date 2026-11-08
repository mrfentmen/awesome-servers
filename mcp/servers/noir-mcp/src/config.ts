import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "noir",
  "displayName": "Noir",
  "version": "1.0.0",
  "extensions": [
    ".nr"
  ],
  "markers": [
    "Nargo.toml"
  ],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "contract",
      "pattern": "^\\s*contract\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "impl",
      "pattern": "^\\s*impl\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*mod\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "global",
      "pattern": "^\\s*global\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z0-9_:{}, ]+)"
    }
  ],
  "build": [
    {
      "command": "nargo",
      "args": [
        "build"
      ]
    }
  ],
  "test": [
    {
      "command": "nargo",
      "args": [
        "test"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "Nargo.toml",
      "content": "[package]\nname = \"{{name}}\"\ntype = \"bin\"\nauthors = [\"\"]\n\n[dependencies]\n"
    },
    {
      "path": "src/main.nr",
      "content": "fn main(value: Field) -> pub Field {\n    value + 1\n}\n\n#[test]\nfn test_add() {\n    assert(2 + 2 == 4);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name(value: Field) -> Field {\n    value + 1\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n    value: Field,\n}"
    },
    "test": {
      "description": "test",
      "body": "#[test]\nfn test_name() {\n    assert(2 + 2 == 4);\n}"
    }
  },
  "reference": "Noir syntax reference\n- Function: fn name(value: Field) -> Field { value + 1 }\n- Main: fn main(value: Field) -> pub Field { ... }\n- Struct: struct Name { value: Field }\n- Impl: impl Name { ... }\n- Module: mod name;\n- Global: global NAME: Field = 1;\n- Import: use path::to::Item;\n- Test: #[test] fn test_name() { assert(true); }\n- Build: nargo build; test: nargo test"
}
