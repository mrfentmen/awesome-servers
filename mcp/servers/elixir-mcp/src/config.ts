import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "elixir",
  "displayName": "Elixir",
  "version": "1.0.0",
  "extensions": [
    ".ex",
    ".exs"
  ],
  "markers": [
    "mix.exs"
  ],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*defmodule\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([a-z_][A-Za-z0-9_!?]*)"
    },
    {
      "kind": "private function",
      "pattern": "^\\s*defp\\s+([a-z_][A-Za-z0-9_!?]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*defstruct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "macro",
      "pattern": "^\\s*defmacro\\s+([a-z_][A-Za-z0-9_!?]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "alias",
      "pattern": "^\\s*alias\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Z][A-Za-z0-9_.]*)"
    },
    {
      "kind": "require",
      "pattern": "^\\s*require\\s+([A-Z][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "lib/demo.ex",
      "content": "defmodule Demo do\n  def greet do\n    IO.puts(\"Hello from Elixir\")\n  end\nend\n"
    },
    {
      "path": "tests/run.exs",
      "content": "if 2 + 2 != 4, do: raise(\"math failed\")\nIO.puts(\"ok\")\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "defmodule Name do\n  def run do\n    :ok\n  end\nend"
    },
    "function": {
      "description": "function",
      "body": "def name(value) do\n  value + 1\nend"
    },
    "struct": {
      "description": "struct",
      "body": "defstruct value: nil"
    }
  },
  "reference": "Elixir syntax reference\n- Module: defmodule Name do ... end\n- Function: def name(value) do ... end\n- Private: defp name(value) do ... end\n- Struct: defstruct value: nil\n- Macro: defmacro name(value) do ... end\n- Pipe: value |> function()\n- Pattern matching: {:ok, value} = result\n- Import: import Enum; alias App.Name; use GenServer\n- Comment: # line\n- Run: elixir file.exs"
}
