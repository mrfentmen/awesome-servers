import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "boogie",
  "displayName": "Boogie",
  "version": "1.0.0",
  "extensions": [
    ".bpl"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*procedure\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "implementation",
      "pattern": "^\\s*implementation\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bpl",
      "content": "procedure Add(a: int, b: int) returns (c: int)\n{\n  c := a + b;\n}\n"
    },
    {
      "path": "tests/run.bpl",
      "content": "procedure Test()\n{\n  assert 2 + 2 == 4;\n}\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "procedure Name(value: int) returns (result: int)\n{\n  result := value + 1;\n}"
    },
    "function": {
      "description": "function",
      "body": "function name(value: int): int { value + 1 }"
    },
    "assertion": {
      "description": "assert",
      "body": "assert 2 + 2 == 4;"
    }
  },
  "reference": "Boogie syntax reference\n- Procedure: procedure Name(value: int) returns (result: int) { ... }\n- Implementation: implementation Name(value: int) returns (result: int) { ... }\n- Function: function name(value: int): int { value + 1 }\n- Type: type Name;\n- Variable: var value: int;\n- Assert: assert 2 + 2 == 4;\n- Assign: result := value + 1;\n- Comment: // line\n- Verify: boogie file.bpl"
}
