import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mercury",
  "displayName": "Mercury",
  "version": "1.0.0",
  "extensions": [
    ".m",
    ".moo"
  ],
  "markers": [],
  "comment": "%",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*:- module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "predicate",
      "pattern": "^\\s*:- pred\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*:- func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*:- type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import_module",
      "pattern": "^\\s*:- import_module\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "use_module",
      "pattern": "^\\s*:- use_module\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.m",
      "content": ":- module demo.\n:- interface.\n:- import_module io.\n\n:- pred main(io::di, io::uo) is det.\n\n:- implementation.\n\nmain(!IO) :-\n    io.write_string(\"ok\\n\", !IO).\n"
    },
    {
      "path": "tests/run.m",
      "content": ":- module run.\n:- interface.\n:- import_module io.\n\n:- pred main(io::di, io::uo) is det.\n\n:- implementation.\n\nmain(!IO) :-\n    io.write_string(\"ok\\n\", !IO).\n"
    }
  ],
  "snippets": {
    "predicate": {
      "description": "predicate",
      "body": ":- pred name(int::in, int::out) is det."
    },
    "function": {
      "description": "function",
      "body": ":- func name(int) = int."
    },
    "module": {
      "description": "module",
      "body": ":- module name.\n:- interface.\n:- implementation."
    }
  },
  "reference": "Mercury syntax reference\n- Module: :- module name.\n- Interface: :- interface.\n- Implementation: :- implementation.\n- Predicate: :- pred name(int::in, int::out) is det.\n- Function: :- func name(int) = int.\n- Type: :- type name ---> value.\n- Import: :- import_module io.\n- Rule: name(X, Y) :- Y = X + 1.\n- Comment: % line; /* block */\n- Compile: mmc file.m"
}
