# switchbot-mcp

SwitchBot API v1.1: list devices, read status, send commands. HMAC-signed requests.

## Setup

```bash
export SWITCHBOT_TOKEN=...
```

Needs SwitchBot token + secret from the mobile app (Profile > Preferences > App Version tap > Developer Options).

## Tools

- `list_devices` — All SwitchBot devices: bots, curtains, meters, plugs, locks, cameras with ids and types.
- `get_device_status` — Live SwitchBot device status: temperature, humidity, battery, on/off, position.
- `send_command` — Control a SwitchBot device: turnOn/turnOff, press, setPosition, setBrightness and more.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
