import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "octave",
  "displayName": "Octave",
  "version": "1.0.0",
  "extensions": [
    ".m"
  ],
  "markers": [],
  "comment": "%",
  "blockComment": {
    "start": "%{",
    "end": "%}"
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
      "kind": "classdef",
      "pattern": "^\\s*classdef\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "source",
      "pattern": "^\\s*source\\s*\\(\\s*[\"']([^\"']+)"
    },
    {
      "kind": "pkg",
      "pattern": "^\\s*pkg\\s+load\\s+([A-Za-z0-9_-]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.m",
      "content": "function y = add(a, b)\n  y = a + b;\nendfunction\n"
    },
    {
      "path": "tests/run.m",
      "content": "if 2 + 2 != 4\n  error('math failed');\nend\ndisp('ok');\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function y = name(x)\n  y = x + 1;\nendfunction"
    },
    "matrix": {
      "description": "matrix",
      "body": "A = [1 2; 3 4];"
    },
    "plot": {
      "description": "plot",
      "body": "x = linspace(0, 2*pi, 100);\nplot(x, sin(x));"
    }
  },
  "reference": "Octave syntax reference\n- Function: function y = name(x) y = x + 1; endfunction\n- Variable: name = value;\n- Matrix: A = [1 2; 3 4];\n- Conditional: if condition ... elseif ... else ... end\n- Loop: for i = 1:10 ... end; while condition ... end\n- Plot: plot(x, y);\n- Source: source('file.m')\n- Comment: % line; %{ block %}\n- Run: octave file.m"
}
