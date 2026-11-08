import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "julia",
  "displayName": "Julia",
  "version": "1.0.0",
  "extensions": [
    ".jl"
  ],
  "markers": [],
  "comment": "#",
  "blockComment": {
    "start": "#=",
    "end": "=#"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_!]*)"
    },
    {
      "kind": "short function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_!]*)\\s*\\([^)]*\\)\\s*="
    },
    {
      "kind": "struct",
      "pattern": "^\\s*(?:mutable\\s+)?struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*macro\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "include",
      "pattern": "^\\s*include\\s*\\(\\s*[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.jl",
      "content": "module Demo\n\nfunction greet()\n    println(\"Hello from Julia\")\nend\n\nend\n"
    },
    {
      "path": "tests/run.jl",
      "content": "if 2 + 2 != 4\n    error(\"math failed\")\nend\nprintln(\"ok\")\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(value)\n    return value + 1\nend"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name\n    value::Int\nend"
    },
    "module": {
      "description": "module",
      "body": "module Name\n\nend"
    }
  },
  "reference": "Julia syntax reference\n- Function: function name(value) return value + 1 end\n- Short function: name(value) = value + 1\n- Variable: name = value\n- Struct: struct Name value::Int end\n- Module: module Name ... end\n- Macro: macro name(value) ... end\n- Imports: using Package; import Package.name\n- Include: include(\"file.jl\")\n- Comment: # line; #= block =#\n- Run: julia file.jl"
}
