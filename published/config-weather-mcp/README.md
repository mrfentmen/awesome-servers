# config-weather-mcp

Config Weather reports whether a project feels clear, cloudy, or stormy based on configuration file count, environment reference pressure, duplicate key signals, and format spread.

## Quick start

```bash
npm install
npm test
npm start
```

Use `inspect_config_weather` with a local project path.

## Privacy and limits

The scanner reads bounded configuration and source-like files but returns only counts and broad categories. Values, secrets, paths, source text, and configuration key names are suppressed. This is a complexity signal, not a configuration validator.
