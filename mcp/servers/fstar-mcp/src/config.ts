import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fstar",
  "displayName": "F*",
  "version": "1.0.0",
  "extensions": [
    ".fst",
    ".fsti"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "let",
      "pattern": "^\\s*let\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "val",
      "pattern": "^\\s*val\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "lemma",
      "pattern": "^\\s*lemma\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "open",
      "pattern": "^\\s*open\\s+([A-Za-z0-9_.]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.fst",
      "content": "module Demo\n\nlet add (a:int) (b:int) : int = a + b\n\nlet test () : Lemma (add 2 2 == 4) = ()\n"
    },
    {
      "path": "tests/Test.fst",
      "content": "module Test\nlet value : int = 2 + 2\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module Name"
    },
    "let": {
      "description": "let binding",
      "body": "let name (value:int) : int = value + 1"
    },
    "lemma": {
      "description": "lemma",
      "body": "let name () : Lemma (2 + 2 == 4) = ()"
    }
  },
  "reference": "F* syntax reference\n- Module: module Name\n- Let: let name (value:int) : int = value + 1\n- Type: type name = int\n- Val: val name : int -> int\n- Lemma: let name () : Lemma (2 + 2 == 4) = ()\n- Open: open FStar.List\n- Comment: // line; (* block *)\n- Check: fstar.exe file.fst"
}
