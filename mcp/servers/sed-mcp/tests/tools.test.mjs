import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Boot the built server, do the MCP handshake, return {serverInfo, tools}. */
function listTools() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js'], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = '';
    let serverInfo = null;
    let tools = null;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('server did not answer tools/list within 8s'));
    }, 8000);

    child.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id === 1 && msg.result) serverInfo = msg.result.serverInfo;
        if (msg.id === 2 && msg.result) tools = msg.result.tools;
      }
      if (tools) {
        clearTimeout(timer);
        child.kill();
        resolve({ serverInfo, tools });
      }
    });
    child.stderr.on('data', () => {});
    child.on('error', reject);

    const send = (o) => child.stdin.write(JSON.stringify(o) + '\n');
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } } });
    setTimeout(() => send({ jsonrpc: '2.0', method: 'notifications/initialized' }), 100);
    setTimeout(() => send({ jsonrpc: '2.0', id: 2, method: 'tools/list' }), 200);
  });
}

test('server boots and answers tools/list', async () => {
  const { serverInfo } = await listTools();
  assert.ok(serverInfo && serverInfo.name, 'expected serverInfo.name');
  assert.ok(serverInfo && serverInfo.version, 'expected serverInfo.version');
});

test('registers at least 20 tools', async () => {
  const { tools } = await listTools();
  assert.ok(tools.length >= 20, `expected >= 20 tools, got ${tools.length}`);
});

test('every tool is well formed', async () => {
  const { tools } = await listTools();
  const names = new Set();
  for (const t of tools) {
    assert.ok(t.name && /^[a-z0-9_]+$/.test(t.name), `bad tool name: ${t.name}`);
    assert.ok(t.description && t.description.length > 10, `${t.name} has no useful description`);
    assert.ok(t.inputSchema && typeof t.inputSchema === 'object', `${t.name} has no inputSchema`);
    assert.ok(!names.has(t.name), `duplicate tool name: ${t.name}`);
    names.add(t.name);
  }
});
