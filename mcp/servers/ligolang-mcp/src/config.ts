import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ligolang",
  "displayName": "LigoLANG",
  "version": "1.0.0",
  "extensions": [
    ".ligo"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*#import\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ligo",
      "content": "function add (const a: int; const b: int) : int is\n  a + b\n"
    },
    {
      "path": "tests/run.ligo",
      "content": "function add (const a: int; const b: int) : int is\n  a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function value (const a: int) : int is\n  a + 1"
    }
  },
  "reference": "LigoLANG syntax reference\n- Function: function value (const a: int) : int is a + 1\n- Type: type name is int\n- Module: module Name is ...\n- Import: #import \"file.ligo\"\n- Variable: const value: int = 1;\n- Comment: // line; /* block */\n- Compile: ligo compile file.ligo",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
