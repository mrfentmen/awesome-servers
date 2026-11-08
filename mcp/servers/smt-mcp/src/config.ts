import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "smt",
  "displayName": "SMT",
  "version": "1.0.0",
  "extensions": [
    ".smt2",
    ".smt",
    ".z3"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(declare-fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*\\(declare-const\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "definition",
      "pattern": "^\\s*\\(define-fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "sort",
      "pattern": "^\\s*\\(declare-sort\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*\\(include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.smt2",
      "content": "(set-logic QF_LIA)\n(declare-const x Int)\n(assert (= (+ x 0) x))\n(check-sat)\n"
    },
    {
      "path": "tests/run.smt2",
      "content": "(set-logic QF_LIA)\n(assert (= (+ 2 2) 4))\n(check-sat)\n"
    }
  ],
  "snippets": {
    "constant": {
      "description": "constant",
      "body": "(declare-const x Int)"
    },
    "function": {
      "description": "function",
      "body": "(declare-fun f (Int) Int)"
    },
    "assert": {
      "description": "assert",
      "body": "(assert (= (+ 2 2) 4))"
    }
  },
  "reference": "SMT-LIB syntax reference\n- Logic: (set-logic QF_LIA)\n- Constant: (declare-const x Int)\n- Function: (declare-fun f (Int) Int)\n- Definition: (define-fun f ((x Int)) Int x)\n- Assert: (assert (= (+ 2 2) 4))\n- Check: (check-sat)\n- Model: (get-model)\n- Include: (include \"file.smt2\")\n- Comment: ; line\n- Run: z3 file.smt2"
}
