import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lasso",
  "displayName": "Lasso",
  "version": "1.0.0",
  "extensions": [
    ".lasso",
    ".las",
    ".lasso8",
    ".lasso9"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*define\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:define\\s+)?type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+([A-Za-z_][A-Za-z0-9_./-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.lasso",
      "content": "define add(a::integer, b::integer) => #a + #b\n"
    },
    {
      "path": "tests/run.lasso",
      "content": "define add(a::integer, b::integer) => #a + #b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "define value(a::integer) => #a + 1"
    }
  },
  "reference": "Lasso syntax reference\n- Function: define value(a::integer) => #a + 1\n- Type: type Name => string\n- Include: include \"file.lasso\"\n- Variable: local(value = 1)\n- Output: #value\n- Conditional: if(#value == 1) => { ... }\n- Comment: // line; /* block */\n- Run: lasso9 file.lasso",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
