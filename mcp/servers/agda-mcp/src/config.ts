import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "agda",
  "displayName": "Agda",
  "version": "1.0.0",
  "extensions": [
    ".agda"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "{-",
    "end": "-}"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_.-]*)"
    },
    {
      "kind": "data",
      "pattern": "^\\s*data\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "record",
      "pattern": "^\\s*record\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "postulate",
      "pattern": "^\\s*postulate\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "open-import",
      "pattern": "^\\s*open\\s+import\\s+([A-Za-z0-9_.-]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.agda",
      "content": "module Demo where\n\ndata Bool : Set where\n  true : Bool\n  false : Bool\n"
    },
    {
      "path": "tests/Test.agda",
      "content": "module Test where\n\nopen import Demo\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module Name where"
    },
    "data": {
      "description": "data type",
      "body": "data Name : Set where\n  value : Name"
    },
    "record": {
      "description": "record",
      "body": "record Name : Set where\n  field : Bool"
    }
  },
  "reference": "Agda syntax reference\n- Module: module Name where\n- Import: open import Data.Bool\n- Data: data Bool : Set where true : Bool; false : Bool\n- Record: record Name : Set where field : Bool\n- Function: name : Bool -> Bool; name x = x\n- Postulate: postulate name : Bool\n- Comment: -- line; {- block -}\n- Check: agda file.agda"
}
