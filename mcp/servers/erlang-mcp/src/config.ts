import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "erlang",
  "displayName": "Erlang",
  "version": "1.0.0",
  "extensions": [
    ".erl",
    ".hrl"
  ],
  "markers": [],
  "comment": "%",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*-module\\s*\\(\\s*([a-z][a-z0-9_]*)"
    },
    {
      "kind": "export",
      "pattern": "^\\s*-export\\s*\\(\\s*\\[([^\\]]+)"
    },
    {
      "kind": "record",
      "pattern": "^\\s*-record\\s*\\(\\s*([a-z][a-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][a-z0-9_]*)\\s*\\("
    },
    {
      "kind": "behaviour",
      "pattern": "^\\s*-behaviour\\s*\\(\\s*([a-z][a-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*-include\\s*\\(\\s*\"([^\"]+)"
    },
    {
      "kind": "include_lib",
      "pattern": "^\\s*-include_lib\\s*\\(\\s*\"([^\"]+)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*-import\\s*\\(\\s*([a-z][a-z0-9_]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.erl",
      "content": "-module(demo).\n-export([greet/0]).\n\ngreet() ->\n    io:format(\"Hello from Erlang~n\").\n"
    },
    {
      "path": "tests/run.erl",
      "content": "-module(run).\n-export([main/0]).\n\nmain() ->\n    4 = 2 + 2,\n    io:format(\"ok~n\").\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "-module(name).\n-export([run/0])."
    },
    "function": {
      "description": "function",
      "body": "run() ->\n    ok."
    },
    "record": {
      "description": "record",
      "body": "-record(name, {value = 0})."
    }
  },
  "reference": "Erlang syntax reference\n- Module: -module(name).\n- Export: -export([run/0]).\n- Function: run() -> ok.\n- Record: -record(name, {value = 0}).\n- Pattern match: {ok, Value} = Result\n- Case: case Value of one -> 1; _ -> 0 end\n- Include: -include(\"file.hrl\").\n- Comment: % line\n- Run: erl -noshell -s module function -s init stop"
}
