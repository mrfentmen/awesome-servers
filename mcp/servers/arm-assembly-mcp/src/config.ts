import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "arm-assembly",
  "displayName": "ARM Assembly",
  "version": "1.0.0",
  "extensions": [
    ".s",
    ".S"
  ],
  "markers": [],
  "comment": "@",
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
      "pattern": "^\\s*\\.(?:global|globl)\\s+([A-Za-z_.][A-Za-z0-9_.]*)"
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
      "content": ".global _start\n.text\n\n_start:\n    mov r0, #1\n    mov r7, #1\n    svc #0\n"
    },
    {
      "path": "tests/run.s",
      "content": ".global _start\n.text\n\n_start:\n    mov r0, #0\n    mov r7, #1\n    svc #0\n"
    }
  ],
  "snippets": {
    "label": {
      "description": "label",
      "body": "name:\n    nop"
    },
    "function": {
      "description": "function",
      "body": "name:\n    push {r4, lr}\n    pop {r4, pc}"
    },
    "data": {
      "description": "data",
      "body": ".data\nname: .word 0"
    }
  },
  "reference": "ARM Assembly syntax reference\n- Directive: .global _start\n- Section: .text; .data\n- Label: name:\n- Move: mov r0, #1\n- Add: add r0, r0, #1\n- Branch: b name; bl name\n- Supervisor call: svc #0\n- Include: .include \"file.s\"\n- Comment: @ line\n- Assemble: arm-none-eabi-as file.s"
}
