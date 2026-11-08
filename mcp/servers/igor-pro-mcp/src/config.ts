import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "igor-pro",
  "displayName": "IGOR Pro",
  "version": "1.0.0",
  "extensions": [
    ".ipf"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*Function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*Macro\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "window",
      "pattern": "^\\s*Window\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:Variable|NVAR|SVAR)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "procedures/demo.ipf",
      "content": "Function demo()\n    return 2 + 2\nEnd\n"
    },
    {
      "path": "tests/run.ipf",
      "content": "Macro Run()\n    if (2 + 2 != 4)\n        Abort \"math failed\"\n    endif\nEnd\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Function name(value)\n    return value + 1\nEnd"
    },
    "macro": {
      "description": "macro",
      "body": "Macro name()\nEnd"
    },
    "wave": {
      "description": "wave",
      "body": "Make/O/N=10 name"
    }
  },
  "reference": "IGOR Pro syntax reference\n- Function: Function name(value) ... return value End\n- Macro: Macro name() ... End\n- Window: Window name() ... End\n- Variable: Variable name = 1\n- Wave: Make/O/N=10 name\n- Conditional: if (condition) ... endif\n- Loop: for (i = 0; i < 10; i += 1) ... endfor\n- Include: #include \"file.ipf\"\n- Comment: // line\n- Run: Igor file.ipf"
}
