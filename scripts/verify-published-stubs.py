import io, json, sys, tarfile, time, urllib.parse, urllib.request
from pathlib import Path

UA = {'User-Agent': 'verify'}
pkgs = sys.argv[1:]
rows = []
for pkg in pkgs:
    man = json.loads(Path(f'/tmp/pm/published/{pkg}/package.json').read_text())
    name, want = man['name'], man['version']
    rec = (pkg, want, '?', -1)
    for _ in range(8):
        try:
            url = 'https://registry.npmjs.org/' + urllib.parse.quote(name, safe='')
            m = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20))
            latest = m['dist-tags']['latest']
            if latest != want:
                rec = (pkg, want, latest, -1)
                time.sleep(8)
                continue
            blob = urllib.request.urlopen(
                urllib.request.Request(m['versions'][want]['dist']['tarball'], headers=UA), timeout=30
            ).read()
            stubs = 0
            with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as tf:
                for mem in tf.getmembers():
                    if mem.isfile() and mem.name.endswith('.js'):
                        stubs += tf.extractfile(mem).read().decode('utf-8', 'replace').count('Not yet implemented')
            rec = (pkg, want, latest, stubs)
            break
        except Exception:
            time.sleep(8)
    rows.append(rec)
    print(f'{rec[0]:24s} want={rec[1]:7s} latest={rec[2]:7s} stubs={rec[3]}')
ok = sum(1 for r in rows if r[2] == r[1] and r[3] == 0)
print(f'\nclean: {ok}/{len(rows)}')
