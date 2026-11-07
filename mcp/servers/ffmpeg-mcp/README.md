# ffmpeg-mcp

Probe, convert, trim, compress and pull audio or thumbnails from local media using ffmpeg.
No API key, no account, nothing uploaded.

## Requirements

- Node 20+
- `ffmpeg` and `ffprobe` on your PATH (or set `FFMPEG_PATH` / `FFPROBE_PATH`)

Install on macOS: `brew install ffmpeg`. On Debian/Ubuntu: `sudo apt install ffmpeg`.

## Install

```bash
git clone https://github.com/mrfentmen/awesome-servers.git
cd awesome-servers/mcp/servers/ffmpeg-mcp
npm install
npm run build
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "ffmpeg": {
      "command": "node",
      "args": ["/absolute/path/to/ffmpeg-mcp/dist/index.js"],
      "env": {
        "FFMPEG_MCP_ALLOWED_DIRS": "/Users/you/Videos:/Users/you/Downloads"
      }
    }
  }
}
```

## Tools

| Tool | What it does |
| --- | --- |
| `probe` | Format, duration, size, bitrate and streams |
| `convert` | Change container/codec, resize, trim, adjust quality |
| `extract_audio` | Pull audio to MP3, WAV, M4A, AAC, FLAC, OGG or Opus |
| `thumbnail` | Save one frame as PNG or JPEG |
| `trim` | Cut a section; stream copy or exact re-encode |
| `compress` | Shrink video with H.264 CRF + AAC |

### probe

```json
{ "path": "/Users/you/Videos/talk.mp4" }
```

### convert

- `input`, `output`
- `vcodec`, `acodec` — empty means ffmpeg's default
- `crf` — 0 to 63, lower is better; `null` keeps the codec default
- `preset` — `ultrafast` … `veryslow`
- `scale` — e.g. `1280:-2` (height follows the aspect ratio)
- `start`, `duration` — e.g. `00:00:05`
- `timeout` — 1 to 600 seconds
- `overwrite` — false by default

### extract_audio

Output extension decides the codec. Supported: `.mp3`, `.wav`, `.m4a`, `.aac`, `.flac`, `.ogg`,
`.opus`.

### thumbnail

- `timestamp` — default `00:00:01`
- `width` — 16 to 4096, default 640

### trim

- `start`, `duration`
- `reencode` — false uses stream copy (fast, cuts at keyframes); true re-encodes for exact cuts

### compress

- `crf` — 0 to 51, default 28 (23 high quality, 32 rough)
- `preset` — default `medium`
- `audio_bitrate` — default `128k`

## Safety

- **Path jail.** Input and output must resolve inside the allowed directories. Symlinks are
  resolved first, so a link cannot escape.
- **No shell.** ffmpeg is started with an argument array, never a shell string.
- **No accidental overwrite.** An existing output is refused unless `overwrite` is true.
- **Input protected.** Output cannot be the same path as input.
- **Timeouts.** Every job is killed after its timeout.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `FFMPEG_MCP_ALLOWED_DIRS` | your home directory | Folders the server may read/write, separated by `:` (`;` on Windows) |
| `FFMPEG_PATH` | `ffmpeg` | Path to the ffmpeg binary |
| `FFPROBE_PATH` | `ffprobe` | Path to the ffprobe binary |

## Limits

- One ffmpeg job at a time per tool call; jobs are independent.
- `trim` with stream copy cuts at the nearest keyframe, so the result can be slightly longer or
  shorter. Set `reencode` for frame-exact cuts.
- `compress` always writes H.264/AAC in an MP4/MOV-style container. Use `convert` for other codecs.

## License

MIT. ffmpeg is a separate project with its own license.
