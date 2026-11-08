import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fsharp",
  "displayName": "F#",
  "version": "1.0.0",
  "extensions": [
    ".fs",
    ".fsi",
    ".fsx"
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
      "pattern": "^\\s*module\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([A-Za-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "member",
      "pattern": "^\\s*member\\s+(?:this|self)\\.([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "open",
      "pattern": "^\\s*open\\s+([A-Z][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.fs",
      "content": "module Demo\n\nlet add a b = a + b\n\nprintfn \"%d\" (add 2 2)\n"
    },
    {
      "path": "tests/Run.fsx",
      "content": "if 2 + 2 <> 4 then failwith \"math failed\"\nprintfn \"ok\"\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let name value = value + 1"
    },
    "type": {
      "description": "record type",
      "body": "type Name = { Value: int }"
    },
    "module": {
      "description": "module",
      "body": "module Name"
    }
  },
  "reference": "F# syntax reference\n- Module: module Name\n- Namespace: namespace Name\n- Function: let name value = value + 1\n- Type: type Name = { Value: int }\n- Member: member this.Name = value\n- Pattern matching: match value with | Some x -> x | None -> 0\n- Open: open System\n- Comment: // line; (* block *)\n- Run: dotnet fsi file.fsx"
}
