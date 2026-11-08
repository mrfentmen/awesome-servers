import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "common-lisp",
  "displayName": "Common Lisp",
  "version": "1.0.0",
  "extensions": [
    ".lisp",
    ".lsp",
    ".cl",
    ".asd"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\(defun\\s+([^\\s()]+)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*\\(defmacro\\s+([^\\s()]+)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*\\(defclass\\s+([^\\s()]+)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*\\(defmethod\\s+([^\\s()]+)"
    },
    {
      "kind": "generic",
      "pattern": "^\\s*\\(defgeneric\\s+([^\\s()]+)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*\\(def(?:var|parameter|constant)\\s+([^\\s()]+)"
    }
  ],
  "imports": [
    {
      "kind": "quickload",
      "pattern": "^\\s*\\(ql:quickload\\s+(.+)$"
    },
    {
      "kind": "require",
      "pattern": "^\\s*\\(require\\s+(.+)$"
    },
    {
      "kind": "load",
      "pattern": "^\\s*\\(load\\s+(.+)$"
    },
    {
      "kind": "asdf",
      "pattern": "^\\s*\\(asdf:load-system\\s+(.+)$"
    }
  ],
  "runner": [
    {
      "command": "sbcl",
      "args": [
        "--script",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "sbcl",
      "args": [
        "--script",
        "tests/run.lisp"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.lisp",
      "content": "(defun main ()\n  (format t \"Hello from Common Lisp~%\"))\n\n(main)\n"
    },
    {
      "path": "tests/run.lisp",
      "content": "(format t \"~a~%\" (+ 2 2))\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(defun name (args)\n  body)"
    },
    "class": {
      "description": "class",
      "body": "(defclass name ()\n  ((slot :initarg :slot :accessor slot)))"
    },
    "package": {
      "description": "package",
      "body": "(defpackage :name\n  (:use :cl)\n  (:export #:main))"
    }
  },
  "reference": "Common Lisp syntax reference\n- Function: (defun name (args) body)\n- Variable: (defvar name value), (defparameter name value)\n- Macro: (defmacro name (args) body)\n- Class: (defclass name (parent) (slots))\n- Method: (defmethod name ((arg type)) body)\n- Package: (defpackage :name (:use :cl))\n- Load a system: (asdf:load-system :name)\n- Quicklisp: (ql:quickload :name)\n- Run with SBCL: sbcl --script file.lisp"
}
