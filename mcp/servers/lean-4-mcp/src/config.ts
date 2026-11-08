import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "lean-4",
  "displayName": "Lean 4",
  "version": "1.0.0",
  "extensions": [
    ".lean"
  ],
  "markers": [],
  "comment": "--",
  "blockComment": {
    "start": "/-",
    "end": "-/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "definition",
      "pattern": "^\\s*(?:noncomputable\\s+)?def\\s+([A-Za-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "theorem",
      "pattern": "^\\s*(?:private\\s+)?theorem\\s+([A-Za-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "lemma",
      "pattern": "^\\s*(?:private\\s+)?lemma\\s+([A-Za-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "structure",
      "pattern": "^\\s*(?:structure|class|inductive)\\s+([A-Za-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+([A-Za-z_][A-Za-z0-9_.']*)"
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
      "path": "src/Demo.lean",
      "content": "def add (a b : Nat) : Nat := a + b\n\n#eval add 2 2\n"
    },
    {
      "path": "tests/DemoTest.lean",
      "content": "example : 2 + 2 = 4 := by decide\n"
    }
  ],
  "snippets": {
    "definition": {
      "description": "definition",
      "body": "def name (value : Nat) : Nat := value + 1"
    },
    "theorem": {
      "description": "theorem",
      "body": "theorem name : 2 + 2 = 4 := by decide"
    },
    "structure": {
      "description": "structure",
      "body": "structure Name where\n  value : Nat"
    }
  },
  "reference": "Lean 4 syntax reference\n- Definition: def name (value : Nat) : Nat := value + 1\n- Theorem: theorem name : 2 + 2 = 4 := by decide\n- Lemma: lemma name : True := by trivial\n- Structure: structure Name where value : Nat\n- Inductive: inductive Name where | value\n- Namespace: namespace Name ... end Name\n- Import: import Mathlib\n- Comment: -- line; /- block -/\n- Build: lake build"
}
