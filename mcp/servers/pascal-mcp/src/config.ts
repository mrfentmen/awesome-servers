import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pascal",
  "displayName": "Pascal",
  "version": "1.0.0",
  "extensions": [
    ".pas",
    ".pp",
    ".dpr",
    ".lpr",
    ".inc"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "{",
    "end": "}"
  },
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "program",
      "pattern": "^\\s*program\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "unit",
      "pattern": "^\\s*unit\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "procedure",
      "pattern": "^\\s*procedure\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(?:record|class|set|array|integer|string)"
    }
  ],
  "imports": [
    {
      "kind": "uses",
      "pattern": "^\\s*uses\\s+(.+)$"
    }
  ],
  "runner": [
    {
      "command": "fpc",
      "args": [
        "-Mobjfpc",
        "-FE{build}",
        "-o{build}/{stem}",
        "{file}"
      ]
    },
    {
      "command": "{build}/{stem}",
      "args": []
    }
  ],
  "build": [
    {
      "command": "fpc",
      "args": [
        "-Mobjfpc",
        "-FE{build}",
        "-o{build}/{stem}",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "fpc",
      "args": [
        "-Mobjfpc",
        "-FE{build}",
        "-o{build}/tests",
        "tests/run.pas"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.pas",
      "content": "program Main;\nbegin\n  writeln('Hello from Pascal');\nend.\n"
    },
    {
      "path": "tests/run.pas",
      "content": "program Test;\nbegin\n  if 2 + 2 <> 4 then\n    halt(1);\n  writeln('ok');\nend.\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "procedure Name(args: Integer);\nbegin\n  // body\nend;"
    },
    "function": {
      "description": "function",
      "body": "function Name(args: Integer): Integer;\nbegin\n  Result := 0;\nend;"
    },
    "program": {
      "description": "program",
      "body": "program Name;\nbegin\n  writeln('Hello');\nend."
    }
  },
  "reference": "Pascal syntax reference\n- Program: program Name; begin ... end.\n- Variables: var name: Integer;\n- Constants: const Name = 42;\n- Types: type Name = record ... end;\n- Procedures: procedure Name(args: Integer); begin ... end;\n- Functions: function Name(args: Integer): Integer;\n- Conditions: if x > 0 then ... else ...;\n- Loops: for i := 1 to 10 do ...; while x > 0 do ...\n- Units: uses SysUtils;\n- Compile with Free Pascal: fpc file.pas"
}
