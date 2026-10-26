import re, pathlib, json

root = pathlib.Path('/tmp/orig-published')
out = []
for pkg in sorted(p for p in root.iterdir() if p.is_dir() and p.name != 'node_modules'):
    f = pkg / 'dist' / 'server.js'
    if not f.exists():
        continue
    src = f.read_text()
    for m in re.finditer(r'registerTool\("([a-z_0-9]+)"', src):
        name = m.group(1)
        window = src[m.start():m.start() + 2400]
        nxt = re.search(r'registerTool\("', window[10:])
        block = window[:nxt.start() + 10] if nxt else window
        if 'Not yet implemented' not in block:
            continue
        desc = re.search(r'description:\s*"((?:[^"\\]|\\.)*)"', block)
        args = re.findall(
            r'(\w+): z\.(string|number|boolean)\(\)(?:\.describe\("((?:[^"\\]|\\.)*)"\))?(\.optional\(\))?',
            block,
        )
        out.append({
            'pkg': pkg.name,
            'tool': name,
            'desc': desc.group(1) if desc else '',
            'args': [{'name': a, 'type': t, 'help': h, 'optional': bool(o)} for a, t, h, o in args],
        })

pathlib.Path('/tmp/stub-spec-all.json').write_text(json.dumps(out, indent=1))
print(len(out), 'stub tools across', len({r['pkg'] for r in out}), 'packages')
