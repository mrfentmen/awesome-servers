import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "idl",
  "displayName": "IDL",
  "version": "1.0.0",
  "extensions": [
    ".pro",
    ".dlm"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*pro\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "common",
      "pattern": "^\\s*common\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*@([A-Za-z0-9_./-]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.pro",
      "content": "pro demo\n  print, 2 + 2\nend\n"
    },
    {
      "path": "tests/run.pro",
      "content": "pro run\n  if 2 + 2 ne 4 then message, 'math failed'\n  print, 'ok'\nend\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "pro name\n  print, 1\nend"
    },
    "function": {
      "description": "function",
      "body": "function name, value\n  return, value + 1\nend"
    },
    "loop": {
      "description": "for loop",
      "body": "for i = 0, 9 do begin\n  print, i\nendfor"
    }
  },
  "reference": "IDL syntax reference\n- Procedure: pro name ... end\n- Function: function name, value ... return, value end\n- Variable: value = 1\n- Print: print, value\n- Conditional: if condition then begin ... endif\n- Loop: for i = 0, 9 do begin ... endfor\n- Include: @file.pro\n- Comment: ; line\n- Run: idl file.pro"
}
