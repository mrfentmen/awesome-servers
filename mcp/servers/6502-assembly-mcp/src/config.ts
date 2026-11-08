import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "6502-assembly",
  "displayName": "6502 Assembly",
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
      "kind": "constant",
      "pattern": "^\\s*([A-Za-z_.][A-Za-z0-9_.]*)\\s*=\\s*"
    },
    {
      "kind": "origin",
      "pattern": "^\\s*\\*\\s*=\\s*(\\$[0-9A-Fa-f]+)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*\\.include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.asm",
      "content": "        * = $0600\nstart:\n        lda #$01\n        sta $0200\n        rts\n"
    },
    {
      "path": "tests/run.asm",
      "content": "        * = $0600\nstart:\n        lda #$04\n        rts\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "subroutine": {
      "description": "subroutine",
      "body": "name:\n    jsr $0000\n    rts"
    },
    "data": {
      "description": "data",
      "body": "name: .byte 0"
    }
  },
  "reference": "6502 Assembly syntax reference\n- Origin: * = $0600\n- Label: name:\n- Load: lda #$01\n- Store: sta $0200\n- Add: adc #$01\n- Jump: jmp name\n- Subroutine: jsr name; rts\n- Include: .include \"file.asm\"\n- Comment: ; line\n- Assemble: ca65 file.asm"
}
