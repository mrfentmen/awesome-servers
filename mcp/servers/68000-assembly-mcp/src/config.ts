import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "68000-assembly",
  "displayName": "68000 Assembly",
  "version": "1.0.0",
  "extensions": [
    ".asm",
    ".s"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "label",
      "pattern": "^\\s*([A-Za-z_.][A-Za-z0-9_.]*):"
    },
    {
      "kind": "equate",
      "pattern": "^\\s*([A-Za-z_.][A-Za-z0-9_.]*)\\s+equ\\s+"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*([A-Za-z_.][A-Za-z0-9_.]*)\\s+macro"
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
      "path": "src/demo.asm",
      "content": "start:\n        moveq #1, d0\n        rts\n"
    },
    {
      "path": "tests/run.asm",
      "content": "start:\n        moveq #4, d0\n        rts\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "subroutine": {
      "description": "subroutine",
      "body": "name:\n    rts"
    },
    "data": {
      "description": "data",
      "body": "name: dc.w 0"
    }
  },
  "reference": "68000 Assembly syntax reference\n- Label: name:\n- Move: moveq #1, d0\n- Add: add.w d1, d0\n- Compare: cmp.w d1, d0\n- Branch: bra name; beq name\n- Subroutine: bsr name; rts\n- Include: include \"file.asm\"\n- Comment: ; line\n- Assemble: vasmm68k_mot file.asm"
}
