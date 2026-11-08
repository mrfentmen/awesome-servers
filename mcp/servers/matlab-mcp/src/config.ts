import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "matlab",
  "displayName": "MATLAB",
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
      "kind": "properties",
      "pattern": "^\\s*properties\\s*\\(?"
    },
    {
      "kind": "methods",
      "pattern": "^\\s*methods\\s*\\(?"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.*]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.m",
      "content": "function y = add(a, b)\n  y = a + b;\nend\n"
    },
    {
      "path": "tests/run.m",
      "content": "if 2 + 2 ~= 4\n  error('math failed');\nend\ndisp('ok');\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function y = name(x)\n  y = x + 1;\nend"
    },
    "classdef": {
      "description": "class",
      "body": "classdef Name\n  properties\n    value\n  end\n  methods\n    function obj = Name(value)\n      obj.value = value;\n    end\n  end\nend"
    },
    "plot": {
      "description": "plot",
      "body": "x = linspace(0, 2*pi, 100);\nplot(x, sin(x));"
    }
  },
  "reference": "MATLAB syntax reference\n- Function: function y = name(x) y = x + 1; end\n- Variable: name = value;\n- Matrix: A = [1 2; 3 4];\n- Conditional: if condition ... elseif ... else ... end\n- Loop: for i = 1:10 ... end; while condition ... end\n- Class: classdef Name properties ... methods ... end\n- Import: import package.*\n- Comment: % line; %{ block %}\n- Run: matlab -batch \"file\""
}
