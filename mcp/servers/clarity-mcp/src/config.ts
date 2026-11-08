import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "clarity",
  "displayName": "Clarity",
  "version": "1.0.0",
  "extensions": [
    ".clar"
  ],
  "markers": [
    "Clarinet.toml"
  ],
  "comment": ";;",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "public-function",
      "pattern": "^\\s*\\(define-public\\s+\\(([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "read-only-function",
      "pattern": "^\\s*\\(define-read-only\\s+\\(([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "data-var",
      "pattern": "^\\s*\\(define-data-var\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "map",
      "pattern": "^\\s*\\(define-map\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*\\(define-constant\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*\\(define-trait\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*\\(use\\s+([^\\s)]+)"
    }
  ],
  "build": [
    {
      "command": "clarinet",
      "args": [
        "check"
      ]
    }
  ],
  "test": [
    {
      "command": "clarinet",
      "args": [
        "test"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "Clarinet.toml",
      "content": "[project]\nname = \"{{name}}\"\n\n[contracts.hello]\npath = \"contracts/hello.clar\"\n"
    },
    {
      "path": "contracts/hello.clar",
      "content": "(define-constant greeting \"Hello from Clarity\")\n\n(define-public (greet)\n  (ok greeting)\n)\n"
    }
  ],
  "snippets": {
    "public-function": {
      "description": "public function",
      "body": "(define-public (name)\n  (ok true)\n)"
    },
    "data-var": {
      "description": "data variable",
      "body": "(define-data-var name uint u0)"
    },
    "map": {
      "description": "map",
      "body": "(define-map Name { key: principal } { value: uint })"
    }
  },
  "reference": "Clarity syntax reference\n- Public function: (define-public (name) (ok true))\n- Read-only function: (define-read-only (name) (ok true))\n- Data var: (define-data-var name uint u0)\n- Map: (define-map Name key-type value-type)\n- Constant: (define-constant name value)\n- Trait: (define-trait Name (...))\n- Use: (use trait-name)\n- Comments start with ;;\n- Build: clarinet check; test: clarinet test"
}
