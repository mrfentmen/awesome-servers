import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "riscv-assembly",
  "displayName": "RISC-V Assembly",
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
      "content": ".text\n.globl main\n\nmain:\n    li a0, 0\n    li a7, 93\n    ecall\n"
    },
    {
      "path": "tests/run.s",
      "content": ".text\n.globl main\n\nmain:\n    li a0, 0\n    li a7, 93\n    ecall\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "function": {
      "description": "function",
      "body": "name:\n    addi sp, sp, -16\n    sd ra, 8(sp)\n    ld ra, 8(sp)\n    addi sp, sp, 16\n    ret"
    },
    "data": {
      "description": "data",
      "body": ".data\nname: .dword 0"
    }
  },
  "reference": "RISC-V Assembly syntax reference\n- Directive: .globl main\n- Section: .text; .data\n- Label: name:\n- Load immediate: li a0, 1\n- Add: add a0, a1, a2\n- Store: sd ra, 8(sp)\n- Return: ret\n- Environment call: ecall\n- Include: .include \"file.s\"\n- Comment: # line\n- Assemble: riscv64-linux-gnu-as file.s"
}
