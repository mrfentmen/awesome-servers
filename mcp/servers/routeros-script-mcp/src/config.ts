import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "routeros-script",
  "displayName": "RouterOS Script",
  "version": "1.0.0",
  "extensions": [
    ".rsc"
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
      "path": "src/demo.rsc",
      "content": "/ip address add address=192.168.1.1/24 interface=ether1\n"
    },
    {
      "path": "tests/run.rsc",
      "content": "/ip address add address=192.168.1.1/24 interface=ether1\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "/ip address add address=192.168.1.1/24 interface=ether1\n"
    }
  },
  "reference": "RouterOS Script syntax reference\n- Example: /ip address add address=192.168.1.1/24 interface=ether1\n- Comment: #\n- No CLI runner configured"
}
