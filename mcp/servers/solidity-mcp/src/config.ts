import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "solidity",
  "displayName": "Solidity",
  "version": "1.0.0",
  "extensions": [
    ".sol"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "contract",
      "pattern": "^\\s*(?:abstract\\s+)?contract\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "library",
      "pattern": "^\\s*library\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "modifier",
      "pattern": "^\\s*modifier\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "event",
      "pattern": "^\\s*event\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "error",
      "pattern": "^\\s*error\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+[^\"']*[\"']([^\"']+)[\"']"
    }
  ],
  "build": [
    {
      "command": "solc",
      "args": [
        "--bin",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "forge",
      "args": [
        "test"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "contracts/Hello.sol",
      "content": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract Hello {\n    function greet() public pure returns (string memory) {\n        return \"Hello from Solidity\";\n    }\n}\n"
    },
    {
      "path": "test/Hello.t.sol",
      "content": "pragma solidity ^0.8.24;\n\ncontract HelloTest {\n    function testAdd() public pure {\n        assert(2 + 2 == 4);\n    }\n}\n"
    }
  ],
  "snippets": {
    "contract": {
      "description": "contract",
      "body": "contract Name {\n    function greet() public pure returns (string memory) {\n        return \"Hello\";\n    }\n}"
    },
    "function": {
      "description": "function",
      "body": "function name(uint256 value) public pure returns (uint256) {\n    return value;\n}"
    },
    "event": {
      "description": "event",
      "body": "event Name(address indexed sender, uint256 value);"
    }
  },
  "reference": "Solidity syntax reference\n- Pragma: pragma solidity ^0.8.24;\n- Contract: contract Name { ... }\n- Function: function name() public pure returns (uint256) { ... }\n- Modifier: modifier onlyOwner() { _; }\n- Event: event Name(address indexed sender);\n- Struct: struct Item { uint256 id; }\n- Error: error Unauthorized();\n- Import: import \"./File.sol\";\n- Build: solc --bin file.sol; tests: forge test"
}
