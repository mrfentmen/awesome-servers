import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function call(requests) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, MCP_LICENSE_KEY: '' } });
    let buf = '';
    const answers = new Map();
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('server did not answer within 10s'));
    }, 10000);

    child.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id !== undefined && msg.id !== null && msg.id !== 0) answers.set(msg.id, msg);
        if (requests.every((_, index) => answers.has(index + 1))) {
          clearTimeout(timer);
          child.kill();
          resolve(answers);
        }
      }
    });
    child.stderr.on('data', () => {});
    child.on('error', reject);

    const send = (o) => child.stdin.write(JSON.stringify(o) + '\n');
    send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } } });
    setTimeout(() => send({ jsonrpc: '2.0', method: 'notifications/initialized' }), 100);
    requests.forEach((request, index) => setTimeout(() => send({ ...request, id: index + 1 }), 150 + index * 40));
  });
}

const toolsList = { jsonrpc: '2.0', method: 'tools/list' };

test('server boots and registers 14 tools', async () => {
  const answers = await call([toolsList]);
  const listed = answers.get(1);
  assert.ok(listed.result, 'expected tools/list result');
  assert.equal(listed.result.tools.length, 14);
  const names = new Set(listed.result.tools.map((tool) => tool.name));
  for (const required of ['parse', 'validate', 'summarize', 'list_records', 'get_record', 'search', 'stats', 'sample', 'format_reference', 'detect_files', 'read_file', 'write_file', 'to_json', 'diff']) {
    assert.ok(names.has(required), `missing tool ${required}`);
  }
});

test('every tool has a description and schema', async () => {
  const answers = await call([toolsList]);
  for (const tool of answers.get(1).result.tools) {
    assert.match(tool.name, /^[a-z0-9_]+$/);
    assert.ok(tool.description.length > 10, `${tool.name} needs a real description`);
    assert.equal(typeof tool.inputSchema, 'object', `${tool.name} needs an input schema`);
  }
});

test('the shipped sample parses with zero errors', async () => {
  const { format } = await import('../dist/format.js');
  const sample = format.sample();
  assert.ok(sample.length > 20, 'sample should not be empty');
  const parsed = format.parse(sample);
  const errors = parsed.issues.filter((issue) => issue.severity === 'error');
  assert.equal(errors.length, 0, `sample invalid: ${errors.map((issue) => issue.message).join('; ')}`);
  assert.ok(parsed.records.length > 0, 'sample should produce records');
});

test('the sample round trips through the server', async () => {
  const { format } = await import('../dist/format.js');
  const answers = await call([
    { jsonrpc: '2.0', method: 'tools/call', params: { name: 'parse', arguments: { content: format.sample() } } },
    { jsonrpc: '2.0', method: 'tools/call', params: { name: 'summarize', arguments: { content: format.sample() } } },
  ]);
  const parsed = JSON.parse(answers.get(1).result.content[0].text);
  assert.ok(parsed.records > 0, 'parse should report records');
  const summary = answers.get(2).result.content[0].text;
  assert.match(summary, /records: \d+/);
});

test('known broken documents are rejected', async () => {
  const { format } = await import('../dist/format.js');
  for (const item of format.regressions ?? []) {
    const parsed = format.parse(item.doc);
    const errors = parsed.issues.filter((issue) => issue.severity === 'error');
    assert.ok(errors.length > 0, `expected an error for: ${item.expectError}`);
    assert.ok(
      errors.some((issue) => issue.message.includes(item.expectError)),
      `expected "${item.expectError}", got: ${errors.map((issue) => issue.message).join('; ')}`,
    );
  }
});

test('premium tool refuses without a licence key', async () => {
  const answers = await call([
    { jsonrpc: '2.0', method: 'tools/call', params: { name: 'to_json', arguments: { content: 'x' } } },
  ]);
  const result = answers.get(1).result;
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /premium tool|MCP_LICENSE_KEY/i);
});
