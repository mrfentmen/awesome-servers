import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ats",
  "displayName": "ATS",
  "version": "1.0.0",
  "extensions": [
    ".dats",
    ".sats",
    ".hats"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:typedef|datatype|abstype)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "implementation",
      "pattern": "^\\s*implement\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "staload",
      "pattern": "^\\s*staload\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.dats",
      "content": "fun add (a: int, b: int): int = a + b\n\nimplement main0 () = println! (add (2, 2))\n"
    },
    {
      "path": "tests/run.dats",
      "content": "fun value (): int = 2 + 2\n\nimplement main0 () = println! (value ())\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun name (value: int): int = value + 1"
    },
    "datatype": {
      "description": "datatype",
      "body": "datatype Name = Value of int"
    },
    "main": {
      "description": "main",
      "body": "implement main0 () = println! (\"ok\")"
    }
  },
  "reference": "ATS syntax reference\n- Function: fun name (value: int): int = value + 1\n- Datatype: datatype Name = Value of int\n- Typedef: typedef Name = int\n- Implementation: implement main0 () = println! (\"ok\")\n- Staload: staload Module\n- Include: #include \"file.h\"\n- Comment: // line; (* block *)\n- Compile: patscc file.dats"
}
