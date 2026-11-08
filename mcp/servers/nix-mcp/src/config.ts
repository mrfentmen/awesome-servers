import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nix",
  "displayName": "Nix",
  "version": "1.0.0",
  "extensions": [
    ".nix"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "\\b(?:function|def|fn|fun|func|proc|procedure|sub|method|class|struct|enum|module|namespace|type|interface|trait|record|object)\\s+([A-Za-z_]\\w*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][\\w<>\\[\\]]*\\s+)+([A-Za-z_]\\w*)\\s*\\("
    },
    {
      "kind": "value",
      "pattern": "^([A-Za-z_]\\w*)\\s*(?::=|=|:)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.nix",
      "content": "{ pkgs ? import <nixpkgs> {} }: pkgs.hello\n"
    },
    {
      "path": "tests/run.nix",
      "content": "{ pkgs ? import <nixpkgs> {} }: pkgs.hello\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "{ pkgs ? import <nixpkgs> {} }: pkgs.hello\n"
    }
  },
  "reference": "Nix syntax reference\n- Example: { pkgs ? import <nixpkgs> {} }: pkgs.hello\n- Comment: #\n- No CLI runner configured"
}
