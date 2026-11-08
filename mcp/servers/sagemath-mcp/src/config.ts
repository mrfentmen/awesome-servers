import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sagemath",
  "displayName": "SageMath",
  "version": "1.0.0",
  "extensions": [
    ".sage",
    ".sagews"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "from",
      "pattern": "^\\s*from\\s+([A-Za-z_][A-Za-z0-9_.]*)\\s+import"
    },
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.sage",
      "content": "def add(a, b):\n    return a + b\n\nprint(add(2, 2))\n"
    },
    {
      "path": "tests/run.sage",
      "content": "if 2 + 2 != 4:\n    raise ValueError('math failed')\nprint('ok')\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def name(value):\n    return value + 1"
    },
    "ring": {
      "description": "polynomial ring",
      "body": "R.<x> = PolynomialRing(QQ)"
    },
    "matrix": {
      "description": "matrix",
      "body": "M = matrix(QQ, [[1, 2], [3, 4]])"
    }
  },
  "reference": "SageMath syntax reference\n- Function: def name(value): return value + 1\n- Class: class Name: ...\n- Variable: name = value\n- Polynomial ring: R.<x> = PolynomialRing(QQ)\n- Matrix: matrix(QQ, [[1, 2], [3, 4]])\n- Import: from sage.all import *\n- Plot: plot(x^2, (x, -5, 5))\n- Comment: # line\n- Run: sage file.sage"
}
