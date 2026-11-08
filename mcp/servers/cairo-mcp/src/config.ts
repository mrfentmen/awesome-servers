import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cairo",
  "displayName": "Cairo",
  "version": "1.0.0",
  "extensions": [
    ".cairo"
  ],
  "markers": [
    "Scarb.toml"
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
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*trait\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "impl",
      "pattern": "^\\s*impl\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*mod\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "command": "scarb",
      "args": [
        "build"
      ]
    }
  ],
  "test": [
    {
      "command": "scarb",
      "args": [
        "test"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "Scarb.toml",
      "content": "[package]\nname = \"{{name}}\"\nversion = \"0.1.0\"\nedition = \"2024_07\"\n\n[dependencies]\nstarknet = \"2.9.2\"\n"
    },
    {
      "path": "src/lib.cairo",
      "content": "fn add(a: u32, b: u32) -> u32 {\n    a + b\n}\n\n#[cfg(test)]\nmod tests {\n    use super::add;\n\n    #[test]\n    fn test_add() {\n        assert(add(2, 2) == 4);\n    }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name(value: u32) -> u32 {\n    value + 1\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n    value: u32,\n}"
    },
    "test": {
      "description": "test",
      "body": "#[test]\nfn test_name() {\n    assert(2 + 2 == 4);\n}"
    }
  },
  "reference": "Cairo syntax reference\n- Function: fn name(value: u32) -> u32 { ... }\n- Struct: struct Name { value: u32 }\n- Trait: trait Name { fn value(self: @Self) -> u32; }\n- Impl: impl NameImpl of Name { ... }\n- Module: mod name;\n- Import: use path::to::Item;\n- Test: #[test] fn test_name() { ... }\n- Build: scarb build; test: scarb test"
}
