# cyberark-mcp

CyberArk PVWA API: logon, safes, accounts. Token cached per process.

## Setup

```bash
export CYBERARK_BASE_URL=...
```

Needs CYBERARK_BASE_URL (PVWA host) plus CYBERARK_USERNAME and CYBERARK_PASSWORD.

## Tools

- `list_safes` — CyberArk safes visible to the logon user.
- `list_accounts` — CyberArk accounts, optionally filtered by safe.
- `get_account` — One CyberArk account by id (metadata, not the password value).

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
