import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "csound",
  "displayName": "Csound",
  "version": "1.0.0",
  "extensions": [
    ".orc",
    ".udo",
    ".sco"
  ],
  "markers": [],
  "comment": ";",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "opcode",
      "pattern": "^\\s*opcode\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "instrument",
      "pattern": "^\\s*instr\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s+init\\s+"
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
      "path": "src/demo.orc",
      "content": "sr = 44100\nksmps = 64\nnchnls = 2\n\ninstr 1\n  print 2 + 2\nendin\n"
    },
    {
      "path": "tests/run.orc",
      "content": "sr = 44100\nksmps = 64\nnchnls = 2\n\ninstr 1\n  print 4\nendin\n"
    }
  ],
  "snippets": {
    "instrument": {
      "description": "instrument",
      "body": "instr 1\n  print 1\nendin"
    },
    "opcode": {
      "description": "opcode",
      "body": "opcode Name, i, ii\n  a1, a2 xin\n  xout a1 + a2\nendop"
    },
    "header": {
      "description": "header",
      "body": "sr = 44100\nksmps = 64\nnchnls = 2"
    }
  },
  "reference": "Csound syntax reference\n- Header: sr = 44100; ksmps = 64; nchnls = 2\n- Instrument: instr 1 ... endin\n- Opcode: opcode Name, i, ii ... endop\n- Variable: kvalue init 0\n- Print: print 1\n- Include: #include \"file.orc\"\n- Score: i 1 0 1\n- Comment: ; line; /* block */\n- Run: csound file.orc"
}
