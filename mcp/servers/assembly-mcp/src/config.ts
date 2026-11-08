import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "assembly",
  "displayName": "Assembly",
  "version": "1.0.0",
  "extensions": [
    ".asm",
    ".s",
    ".inc"
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
      "kind": "section",
      "pattern": "^\\s*section\\s+([A-Za-z_.][A-Za-z0-9_.]*)"
    },
    {
      "kind": "equate",
      "pattern": "^\\s*([A-Za-z_.][A-Za-z0-9_.]*)\\s+equ\\s+"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*%include\\s+\"([^\"]+)"
    },
    {
      "kind": "include",
      "pattern": "^\\s*\\.include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.asm",
      "content": "section .text\nglobal _start\n\n_start:\n    mov eax, 1\n    int 0x80\n"
    },
    {
      "path": "tests/run.asm",
      "content": "section .text\nglobal _start\n\n_start:\n    mov eax, 1\n    int 0x80\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "function": {
      "description": "function",
      "body": "name:\n    push rbp\n    mov rbp, rsp\n    pop rbp\n    ret"
    },
    "data": {
      "description": "data",
      "body": "section .data\nname db 0"
    }
  },
  "reference": "Assembly syntax reference\n- Section: section .text\n- Global: global _start\n- Label: name:\n- Move: mov eax, 1\n- Add: add eax, ebx\n- Compare: cmp eax, ebx\n- Jump: jmp name; je name\n- Include: %include \"file.inc\"\n- Comment: ; line\n- Assemble: nasm -f elf64 file.asm"
}
