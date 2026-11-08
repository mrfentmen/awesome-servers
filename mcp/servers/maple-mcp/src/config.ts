import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "maple",
  "displayName": "Maple",
  "version": "1.0.0",
  "extensions": [
    ".mpl",
    ".maple"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:=\\s*proc"
    },
    {
      "kind": "module",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:=\\s*module"
    },
    {
      "kind": "assignment",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:="
    }
  ],
  "imports": [
    {
      "kind": "with",
      "pattern": "^\\s*with\\s*\\(\\s*([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.mpl",
      "content": "add := proc(a, b)\n    a + b\nend proc:\n\nadd(2, 2);\n"
    },
    {
      "path": "tests/run.mpl",
      "content": "if 2 + 2 <> 4 then\n    error \"math failed\";\nend if:\nprint(\"ok\");\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "name := proc(value)\n    value + 1\nend proc:"
    },
    "module": {
      "description": "module",
      "body": "Name := module()\nend module:"
    },
    "loop": {
      "description": "for loop",
      "body": "for i from 1 to 10 do\n    print(i);\nend do:"
    }
  },
  "reference": "Maple syntax reference\n- Assignment: name := value:\n- Procedure: name := proc(value) value + 1 end proc:\n- Module: Name := module() ... end module:\n- Conditional: if condition then ... end if:\n- Loop: for i from 1 to 10 do ... end do:\n- Function call: add(2, 2);\n- With: with(LinearAlgebra):\n- Comment: # line\n- Run: maple file.mpl"
}
