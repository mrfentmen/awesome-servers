import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "macaulay2",
  "displayName": "Macaulay2",
  "version": "1.0.0",
  "extensions": [
    ".m2"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "assignment",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    },
    {
      "kind": "method",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*method"
    },
    {
      "kind": "ring",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*QQ\\s*\\["
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*load\\s+\"([^\"]+)"
    },
    {
      "kind": "needsPackage",
      "pattern": "^\\s*needsPackage\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.m2",
      "content": "demo = 2 + 2\nR = QQ[x]\nI = ideal(x^2 - 1)\n"
    },
    {
      "path": "tests/run.m2",
      "content": "if 2 + 2 != 4 then error \"math failed\"\nprint \"ok\"\n"
    }
  ],
  "snippets": {
    "assignment": {
      "description": "assignment",
      "body": "name = value"
    },
    "ring": {
      "description": "polynomial ring",
      "body": "R = QQ[x, y]"
    },
    "ideal": {
      "description": "ideal",
      "body": "I = ideal(x^2 - 1, y - 1)"
    }
  },
  "reference": "Macaulay2 syntax reference\n- Assignment: name = value\n- Ring: R = QQ[x, y]\n- Ideal: I = ideal(x^2 - 1)\n- Module: M = coker matrix {{x, y}}\n- Method: name = method(TypicalValue => ZZ)\n- Load: load \"file.m2\"\n- Package: needsPackage \"PackageName\"\n- Comment: -- line\n- Run: M2 file.m2"
}
