import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sqf",
  "displayName": "SQF",
  "version": "1.0.0",
  "extensions": [
    ".sqf",
    ".hqf"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*\\{"
    },
    {
      "kind": "define",
      "pattern": "^\\s*#define\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:private|params)\\s+\\[?([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "scripts/demo.sqf",
      "content": "TAG_fnc_add = {\n    params [\"_a\", \"_b\"];\n    _a + _b\n};\n"
    },
    {
      "path": "tests/run.sqf",
      "content": "TAG_fnc_value = {\n    2 + 2\n};\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "TAG_fnc_name = {\n    params [\"_value\"];\n    _value + 1\n};"
    },
    "define": {
      "description": "define",
      "body": "#define NAME 1"
    },
    "loop": {
      "description": "for loop",
      "body": "for \"_i\" from 0 to 9 do {\n    systemChat str _i;\n};"
    }
  },
  "reference": "SQF syntax reference\n- Function: TAG_fnc_name = { params [\"_value\"]; _value + 1 };\n- Define: #define NAME 1\n- Include: #include \"file.hpp\"\n- Variable: private _value = 1;\n- Conditional: if (condition) then { ... };\n- Loop: for \"_i\" from 0 to 9 do { ... };\n- Comment: // line; /* block */\n- Run: arma3 file.sqf"
}
