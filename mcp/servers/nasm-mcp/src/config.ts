import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nasm",
  "displayName": "NASM",
  "version": "1.0.0",
  "extensions": [
    ".nasm",
    ".asm"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\"",
    "'"
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
      "kind": "macro",
      "pattern": "^\\s*%macro\\s+([A-Za-z_.][A-Za-z0-9_.]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*%include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.asm",
      "content": "section .text\nglobal _start\n\n_start:\n    mov rax, 60\n    xor rdi, rdi\n    syscall\n"
    },
    {
      "path": "tests/run.asm",
      "content": "section .text\nglobal _start\n\n_start:\n    mov rax, 60\n    syscall\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "macro": {
      "description": "macro",
      "body": "%macro name 1\n    mov rax, %1\n%endmacro"
    },
    "data": {
      "description": "data",
      "body": "section .data\nname db 0"
    }
  },
  "reference": "NASM syntax reference\n- Section: section .text\n- Global: global _start\n- Label: name:\n- Instruction: mov rax, 60\n- Syscall: syscall\n- Macro: %macro name 1 ... %endmacro\n- Data: section .data; name db 0\n- Include: %include \"file.asm\"\n- Comment: ; line\n- Assemble: nasm -f elf64 file.asm"
}
