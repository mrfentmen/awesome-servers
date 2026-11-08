import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cython",
  "displayName": "Cython",
  "version": "1.0.0",
  "extensions": [
    ".pyx",
    ".pxd",
    ".pxi"
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
      "pattern": "^\\s*(?:cdef|cpdef|def)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:cdef\\s+)?class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*ctypedef\\s+.*?\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*$"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:cdef|cpdef)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "cimport",
      "pattern": "^\\s*cimport\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.pyx",
      "content": "def add(int a, int b):\n    return a + b\n\nprint(add(2, 2))\n"
    },
    {
      "path": "tests/run.pyx",
      "content": "def test_add():\n    assert 2 + 2 == 4\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "def",
      "body": "def name(int value):\n    return value + 1"
    },
    "cdef": {
      "description": "cdef",
      "body": "cdef int name(int value):\n    return value + 1"
    },
    "class": {
      "description": "class",
      "body": "cdef class Name:\n    cdef int value"
    }
  },
  "reference": "Cython syntax reference\n- Function: def name(int value): return value + 1\n- C function: cdef int name(int value): return value + 1\n- Python-visible: cpdef int name(int value): return value + 1\n- Class: cdef class Name: cdef int value\n- Type: ctypedef int MyInt\n- C import: cimport libc.stdio\n- Import: import math\n- Comment: # line\n- Build: cythonize -i file.pyx"
}
