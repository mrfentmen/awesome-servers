import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "aleo",
  "displayName": "Aleo",
  "version": "1.0.0",
  "extensions": [
    ".aleo"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "program",
      "pattern": "^\\s*program\\s+([A-Za-z_][A-Za-z0-9_]*)\\.aleo"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.aleo",
      "content": "program demo.aleo;\n\nfunction add:\n    input r0 as u32.public;\n    input r1 as u32.public;\n    add r0 r1 into r2;\n    output r2 as u32.public;\n"
    },
    {
      "path": "tests/run.aleo",
      "content": "program test.aleo;\n\nfunction value:\n    output 4u32 as u32.public;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name:\n    input r0 as u32.public;\n    output r0 as u32.public;"
    },
    "record": {
      "description": "record",
      "body": "record Name:\n    owner as address.private;\n    value as u32.private;"
    },
    "mapping": {
      "description": "mapping",
      "body": "mapping values:\n    key as address.public;\n    value as u32.public;"
    }
  },
  "reference": "Aleo syntax reference\n- Program: program name.aleo;\n- Function: function name: input r0 as u32.public; output r0 as u32.public;\n- Struct: struct Name: value as u32;\n- Record: record Name: owner as address.private;\n- Mapping: mapping values: key as address.public; value as u32.public;\n- Import: import other.aleo;\n- Comment: // line\n- Build: leo build"
}
