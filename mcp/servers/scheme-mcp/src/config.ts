import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "scheme",
  "displayName": "Scheme",
  "version": "1.0.0",
  "extensions": [
    ".scm",
    ".ss",
    ".sls",
    ".sld"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(define\\s+\\(([^\\s()]+)"
    },
    {
      "kind": "value",
      "pattern": "^\\s*\\(define\\s+([^\\s()]+)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*\\(define-syntax\\s+([^\\s()]+)"
    },
    {
      "kind": "library",
      "pattern": "^\\s*\\(define-library\\s+\\(([^\\s()]+)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*\\(import\\s+(.+)$"
    },
    {
      "kind": "require",
      "pattern": "^\\s*\\(require\\s+(.+)$"
    },
    {
      "kind": "load",
      "pattern": "^\\s*\\(load\\s+(.+)$"
    }
  ],
  "runner": [
    {
      "command": "guile",
      "args": [
        "-s",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "guile",
      "args": [
        "-s",
        "tests/run.scm"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.scm",
      "content": "(define (main args)\n  (display \"Hello from Scheme\")\n  (newline))\n\n(main (command-line))\n"
    },
    {
      "path": "tests/run.scm",
      "content": "(display (+ 2 2))\n(newline)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "procedure",
      "body": "(define (name args)\n  body)"
    },
    "let": {
      "description": "local binding",
      "body": "(let ((name value))\n  body)"
    },
    "library": {
      "description": "library",
      "body": "(define-library (name)\n  (export main)\n  (import (scheme base)))"
    }
  },
  "reference": "Scheme syntax reference\n- Definitions: (define (name args) body)\n- Values: (define name value)\n- Procedures: (lambda (args) body)\n- Binding: (let ((name value)) body)\n- Conditionals: (if test then else), (cond ...)\n- Lists: (car xs), (cdr xs), (cons x xs), (list ...)\n- Imports: (import (scheme base))\n- Libraries: (define-library (name) ...)\n- Run with Guile: guile -s file.scm"
}
