import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gcc-machine-description",
  "displayName": "GCC Machine Description",
  "version": "1.0.0",
  "extensions": [
    ".md"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "instruction",
      "pattern": "\\(define_insn\\s+\"([^\"]+)\""
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.md",
      "content": "(define_insn \"addsi3\"\n  [(set (match_operand:SI 0 \"register_operand\" \"\")\n        (plus:SI (match_operand:SI 1 \"register_operand\" \"\")\n                 (match_operand:SI 2 \"register_operand\" \"\")))]\n  \"\"\n  \"add %1,%2,%0\")\n"
    },
    {
      "path": "tests/run.md",
      "content": "(define_insn \"addsi3\"\n  [(set (match_operand:SI 0 \"register_operand\" \"\")\n        (plus:SI (match_operand:SI 1 \"register_operand\" \"\")\n                 (match_operand:SI 2 \"register_operand\" \"\")))]\n  \"\"\n  \"add %1,%2,%0\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(define_insn \"addsi3\"\n  [(set (match_operand:SI 0 \"register_operand\" \"\")\n        (plus:SI (match_operand:SI 1 \"register_operand\" \"\")\n                 (match_operand:SI 2 \"register_operand\" \"\")))]\n  \"\"\n  \"add %1,%2,%0\")\n"
    }
  },
  "reference": "GCC Machine Description syntax reference\n- Example: (define_insn \"addsi3\"\n- Comment: ;\n- Run: gcc -c {file}"
}
