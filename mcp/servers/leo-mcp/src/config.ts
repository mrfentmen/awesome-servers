import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "leo",
  "displayName": "Leo",
  "version": "1.0.0",
  "extensions": [
    ".leo"
  ],
  "markers": [
    "program.json"
  ],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "program",
      "pattern": "^\\s*program\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "transition",
      "pattern": "^\\s*transition\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:inline\\s+)?function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "record",
      "pattern": "^\\s*record\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "mapping",
      "pattern": "^\\s*mapping\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "build": [
    {
      "command": "leo",
      "args": [
        "build"
      ]
    }
  ],
  "test": [
    {
      "command": "leo",
      "args": [
        "test"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "program.json",
      "content": "{\n  \"program\": \"{{name}}.aleo\",\n  \"version\": \"0.1.0\",\n  \"description\": \"Leo program\",\n  \"license\": \"MIT\"\n}\n"
    },
    {
      "path": "src/main.leo",
      "content": "program hello.aleo {\n    transition main(value: u32) -> u32 {\n        return value + 1u32;\n    }\n}\n"
    }
  ],
  "snippets": {
    "program": {
      "description": "program",
      "body": "program name.aleo {\n    transition main(value: u32) -> u32 {\n        return value + 1u32;\n    }\n}"
    },
    "transition": {
      "description": "transition",
      "body": "transition name(value: u32) -> u32 {\n    return value;\n}"
    },
    "record": {
      "description": "record",
      "body": "record Name {\n    owner: address,\n    value: u32,\n}"
    }
  },
  "reference": "Leo syntax reference\n- Program: program name.aleo { ... }\n- Transition: transition main(value: u32) -> u32 { return value; }\n- Function: inline function name(value: u32) -> u32 { return value; }\n- Struct: struct Name { value: u32 }\n- Record: record Name { owner: address, value: u32 }\n- Mapping: mapping balances: address => u64;\n- Import: import name.aleo;\n- Build: leo build; test: leo test"
}
