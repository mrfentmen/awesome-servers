import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "racket",
  "displayName": "Racket",
  "version": "1.0.0",
  "extensions": [
    ".rkt",
    ".rktl"
  ],
  "markers": [],
  "comment": ";",
  "blockComment": {
    "start": "#|",
    "end": "|#"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "language",
      "pattern": "^\\s*#lang\\s+([A-Za-z0-9_/-]+)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*\\(module\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*\\(define\\s+\\(([^\\s()]+)"
    },
    {
      "kind": "value",
      "pattern": "^\\s*\\(define\\s+([^\\s()]+)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*\\(struct\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "require",
      "pattern": "^\\s*\\(require\\s+([^\\s()]+)"
    },
    {
      "kind": "provide",
      "pattern": "^\\s*\\(provide\\s+([^\\s()]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.rkt",
      "content": "#lang racket\n\n(define (add a b)\n  (+ a b))\n\n(displayln (add 2 2))\n"
    },
    {
      "path": "tests/run.rkt",
      "content": "#lang racket\nunless (= (+ 2 2) 4) (error \"math failed\")\n(displayln \"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(define (name value)\n  (+ value 1))"
    },
    "struct": {
      "description": "struct",
      "body": "(struct name (value))"
    },
    "module": {
      "description": "module",
      "body": "(module name racket\n  (provide value))"
    }
  },
  "reference": "Racket syntax reference\n- Language: #lang racket\n- Function: (define (name value) (+ value 1))\n- Value: (define name value)\n- Struct: (struct name (value))\n- Module: (module name racket ...)\n- Require: (require racket/list)\n- Provide: (provide name)\n- Comment: ; line; #| block |#\n- Run: racket file.rkt"
}
