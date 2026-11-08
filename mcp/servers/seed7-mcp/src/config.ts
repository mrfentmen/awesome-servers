import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "seed7",
  "displayName": "Seed7",
  "version": "1.0.0",
  "extensions": [
    ".sd7"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*const\\s+func\\s+[A-Za-z_][A-Za-z0-9_]*:\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*var\\s+[A-Za-z_][A-Za-z0-9_]*:\\s*([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.sd7",
      "content": "const func integer: add (in integer: a, in integer: b) is\n  return a + b;\n"
    },
    {
      "path": "tests/run.sd7",
      "content": "const func integer: add (in integer: a, in integer: b) is\n  return a + b;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "const func integer: value (in integer: a) is\n  return a + 1;"
    }
  },
  "reference": "Seed7 syntax reference\n- Function: const func integer: value (in integer: a) is return a + 1;\n- Variable: var integer: value is 1;\n- Include: include \"seed7_05.s7i\";\n- Conditional: if condition then ... end if;\n- Loop: while condition do ... end while;\n- Comment: # line; (* block *)\n- Run: s7 file.sd7",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
