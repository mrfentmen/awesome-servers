import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mips-assembly",
  "displayName": "MIPS Assembly",
  "version": "1.0.0",
  "extensions": [
    ".s",
    ".asm"
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
      "content": ".text\n.globl main\n\nmain:\n    li $v0, 10\n    syscall\n"
    },
    {
      "path": "tests/run.s",
      "content": ".text\n.globl main\n\nmain:\n    li $v0, 10\n    syscall\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "function": {
      "description": "function",
      "body": "name:\n    addiu $sp, $sp, -8\n    sw $ra, 4($sp)\n    lw $ra, 4($sp)\n    jr $ra"
    },
    "data": {
      "description": "data",
      "body": ".data\nname: .word 0"
    }
  },
  "reference": "MIPS Assembly syntax reference\n- Directive: .globl main\n- Section: .text; .data\n- Label: name:\n- Load immediate: li $v0, 1\n- Add: addu $t0, $t1, $t2\n- Store: sw $t0, 0($sp)\n- Return: jr $ra\n- Syscall: syscall\n- Include: .include \"file.s\"\n- Comment: # line\n- Assemble: mips-linux-gnu-as file.s"
}
