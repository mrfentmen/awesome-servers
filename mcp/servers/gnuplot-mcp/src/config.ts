import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gnuplot",
  "displayName": "Gnuplot",
  "version": "1.0.0",
  "extensions": [
    ".gp",
    ".gnu",
    ".gnuplot",
    ".plt"
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
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*="
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    },
    {
      "kind": "label",
      "pattern": "^\\s*set\\s+(?:title|label|xlabel|ylabel)\\s+(.+)$"
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*load\\s+[\"']([^\"']+)"
    },
    {
      "kind": "call",
      "pattern": "^\\s*call\\s+[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "plots/demo.gp",
      "content": "f(x) = x * x\nset title 'Square'\nplot f(x) with lines\n"
    },
    {
      "path": "tests/run.gp",
      "content": "if (2 + 2 != 4) {\n  print 'math failed'\n  exit 1\n}\nprint 'ok'\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "f(x) = x * x"
    },
    "plot": {
      "description": "plot",
      "body": "set title 'Plot'\nplot sin(x) with lines"
    },
    "load": {
      "description": "load",
      "body": "load 'file.gp'"
    }
  },
  "reference": "Gnuplot syntax reference\n- Function: f(x) = x * x\n- Variable: value = 1\n- Plot: plot sin(x) with lines\n- 3D plot: splot x * y\n- Title: set title 'Plot'\n- Labels: set xlabel 'x'; set ylabel 'y'\n- Load: load 'file.gp'\n- Comment: # line\n- Run: gnuplot file.gp"
}
