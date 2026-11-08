import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "emacs-lisp",
  "displayName": "Emacs Lisp",
  "version": "1.0.0",
  "extensions": [
    ".el",
    ".emacs"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*\\((?:cl-)?defun\\s+([^\\s()]+)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*\\(defmacro\\s+([^\\s()]+)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*\\(def(?:var|custom)\\s+([^\\s()]+)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*\\(defclass\\s+([^\\s()]+)"
    },
    {
      "kind": "mode",
      "pattern": "^\\s*\\(define-(?:minor|derived)-mode\\s+([^\\s()]+)"
    }
  ],
  "imports": [
    {
      "kind": "require",
      "pattern": "^\\s*\\(require\\s+'([^\\s()]+)"
    },
    {
      "kind": "load",
      "pattern": "^\\s*\\(load\\s+\"([^\"]+)"
    },
    {
      "kind": "use-package",
      "pattern": "^\\s*\\(use-package\\s+([^\\s()]+)"
    }
  ],
  "runner": [
    {
      "command": "emacs",
      "args": [
        "--batch",
        "-l",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "emacs",
      "args": [
        "--batch",
        "-l",
        "tests/run.el"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.el",
      "content": "(defun main ()\n  (message \"Hello from Emacs Lisp\"))\n\n(main)\n"
    },
    {
      "path": "tests/run.el",
      "content": "(unless (= (+ 2 2) 4) (error \"math failed\"))\n(message \"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "(defun name (args)\n  body)"
    },
    "command": {
      "description": "interactive command",
      "body": "(defun name ()\n  (interactive)\n  (message \"Hello\"))"
    },
    "mode": {
      "description": "minor mode",
      "body": "(define-minor-mode name-mode\n  \"Toggle name mode.\"\n  :lighter \" Name\")"
    }
  },
  "reference": "Emacs Lisp syntax reference\n- Function: (defun name (args) body)\n- Interactive command: (defun name () (interactive) ...)\n- Variable: (defvar name value), (defcustom name value \"doc\" :type 'string)\n- Macro: (defmacro name (args) body)\n- List: (list 1 2 3); quote: '(1 2 3)\n- Conditionals: (if test then else), (when test ...), (unless test ...)\n- Loop: (dolist (item list) body)\n- Require: (require 'package)\n- Run in batch: emacs --batch -l file.el"
}
