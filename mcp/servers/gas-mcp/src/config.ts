import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gas",
  "displayName": "GAS",
  "version": "1.0.0",
  "extensions": [
    ".s",
    ".S"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "label",
      "pattern": "^\\s*([A-Za-z_.][A-Za-z0-9_.]*):"
    },
    {
      "kind": "directive",
      "pattern": "^\\s*\\.(?:globl|global)\\s+([A-Za-z_.][A-Za-z0-9_.]*)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*\\.macro\\s+([A-Za-z_.][A-Za-z0-9_.]*)"
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
      "path": "src/demo.s",
      "content": ".global _start\n.text\n\n_start:\n    mov $60, %rax\n    xor %rdi, %rdi\n    syscall\n"
    },
    {
      "path": "tests/run.s",
      "content": ".global _start\n.text\n\n_start:\n    mov $60, %rax\n    syscall\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "function": {
      "description": "function",
      "body": "name:\n    push %rbp\n    mov %rsp, %rbp\n    pop %rbp\n    ret"
    },
    "data": {
      "description": "data",
      "body": ".data\nname: .quad 0"
    }
  },
  "reference": "GAS syntax reference\n- Directive: .global _start\n- Section: .text; .data; .bss\n- Label: name:\n- Move: mov $60, %rax\n- Syscall: syscall\n- Register: %rax, %rdi, %rsp\n- Immediate: $1\n- Include: .include \"file.s\"\n- Comment: # line\n- Assemble: as file.s -o file.o"
}
