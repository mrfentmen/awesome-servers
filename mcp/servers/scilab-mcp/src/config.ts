import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "scilab",
  "displayName": "Scilab",
  "version": "1.0.0",
  "extensions": [
    ".sci",
    ".sce",
    ".tst"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+(?:\\[[^\\]]+\\]\\s*=\\s*)?(?:[A-Za-z_][A-Za-z0-9_]*\\s*=\\s*)?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "exec",
      "pattern": "^\\s*exec\\s*\\(\\s*[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.sce",
      "content": "function y = add(a, b)\n  y = a + b\nendfunction\n\ndisp(add(2, 2))\n"
    },
    {
      "path": "tests/run.sce",
      "content": "if 2 + 2 <> 4 then\n  error('math failed')\nend\ndisp('ok')\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function y = name(x)\n  y = x + 1\nendfunction"
    },
    "loop": {
      "description": "for loop",
      "body": "for i = 1:10\n  disp(i)\nend"
    },
    "matrix": {
      "description": "matrix",
      "body": "A = [1 2; 3 4]"
    }
  },
  "reference": "Scilab syntax reference\n- Function: function y = name(x) y = x + 1 endfunction\n- Variable: value = 1;\n- Matrix: A = [1 2; 3 4]\n- Conditional: if condition then ... else ... end\n- Loop: for i = 1:10 ... end; while condition ... end\n- Display: disp(value)\n- Exec: exec('file.sce')\n- Comment: // line; /* block */\n- Run: scilab -f file.sce"
}
