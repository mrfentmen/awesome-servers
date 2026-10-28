# Primes

Prime testing, factorisation and searches offline with BigInt - Miller-Rabin, Pollard rho and a segmented sieve, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/primes-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "primes-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/primes-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `is_prime` | Test whether a whole number is prime with deterministic Miller-Rabin up to 10^30. |
| `factorise` | Factorise a number into primes using trial division and Pollard rho, with powers grouped. |
| `primes_in_range` | Find every prime in a numeric range with a segmented sieve. |
| `next_prime` | The next prime strictly above a number, with the gap. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
