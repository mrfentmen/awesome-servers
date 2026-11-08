import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "clean",
  "displayName": "Clean",
  "version": "1.0.0",
  "extensions": [
    ".icl",
    ".dcl"
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
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*::"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*::\\s*([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.icl",
      "content": "module demo\n\nadd :: Int Int -> Int\nadd a b = a + b\n\nStart = add 2 2\n"
    },
    {
      "path": "tests/run.icl",
      "content": "module run\n\nStart = 2 + 2\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "name :: Int -> Int\nname value = value + 1"
    },
    "module": {
      "description": "module",
      "body": "module name"
    },
    "class": {
      "description": "class",
      "body": "class Name a where\n  value :: a -> Int"
    }
  },
  "reference": "Clean syntax reference\n- Module: module name\n- Function type: name :: Int -> Int\n- Function: name value = value + 1\n- Class: class Name a where ...\n- Instance: instance Name Int where ...\n- Import: import StdEnv\n- Start: Start = 2 + 2\n- Comment: // line; /* block */\n- Compile: clm file.icl"
}
