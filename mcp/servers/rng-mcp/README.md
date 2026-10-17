# RNG MCP

Roll dice, flip coins, and generate random integers on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `roll_dice`  Roll dice.
* `coin_flip`  Flip a coin.
* `random_number`  A random integer.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Values come from the platform random number generator. They are not suitable for cryptography.


