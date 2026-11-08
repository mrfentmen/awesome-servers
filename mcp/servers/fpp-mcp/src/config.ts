import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fpp",
  "displayName": "FPP",
  "version": "1.0.0",
  "extensions": [
    ".fpp",
    ".fppi"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.fpp",
      "content": "module demo\ncontains\n  subroutine add(a, b)\n  end subroutine\nend module\n"
    },
    {
      "path": "tests/run.fpp",
      "content": "module demo\ncontains\n  subroutine add(a, b)\n  end subroutine\nend module\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module demo\ncontains\n  subroutine add(a, b)\n  end subroutine\nend module\n"
    }
  },
  "reference": "FPP syntax reference\n- Example: module demo\n- Comment: #\n- Run: fpp {file}"
}
