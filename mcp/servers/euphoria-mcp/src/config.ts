import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "euphoria",
  "displayName": "Euphoria",
  "version": "1.0.0",
  "extensions": [
    ".e",
    ".ex"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*procedure\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*(?:type|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*constant\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ex",
      "content": "function add(integer a, integer b)\n  return a + b\nend function\n\n? add(2, 2)\n"
    },
    {
      "path": "tests/run.ex",
      "content": "if 2 + 2 != 4 then\n  abort(1)\nend if\n? \"ok\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(integer value)\n  return value + 1\nend function"
    },
    "procedure": {
      "description": "procedure",
      "body": "procedure name(integer value)\n  ? value\nend procedure"
    },
    "loop": {
      "description": "for loop",
      "body": "for i = 1 to 10 do\n  ? i\nend for"
    }
  },
  "reference": "Euphoria syntax reference\n- Function: function name(integer value) return value + 1 end function\n- Procedure: procedure name(integer value) ... end procedure\n- Type: type Name(integer value) return value >= 0 end type\n- Constant: constant NAME = 1\n- Conditional: if condition then ... end if\n- Loop: for i = 1 to 10 do ... end for\n- Include: include std/io.e\n- Comment: -- line; /* block */\n- Run: eui file.ex"
}
