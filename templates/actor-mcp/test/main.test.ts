import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

describe('billing events', () => {
    it('defines a pay-per-event entry for every event the code charges', () => {
        const billed = new Set<string>();
        for (const file of ['src/billing.ts', 'src/main.ts']) {
            const source = readFileSync(file, 'utf8');
            for (const match of source.matchAll(/eventName:\s*'([^']+)'/g)) {
                billed.add(match[1]);
            }
        }
        expect(billed.size).toBeGreaterThan(0);

        const events = readJson('.actor/pay_per_event.json');
        for (const eventName of billed) {
            expect(Object.keys(events), `missing pay_per_event entry for ${eventName}`).toContain(eventName);
        }

        // Every declared event needs a positive price and human-readable metadata.
        for (const [eventName, event] of Object.entries<any>(events)) {
            expect(event.eventPriceUsd, eventName).toBeGreaterThan(0);
            expect(event.eventTitle, eventName).toBeTruthy();
            expect(event.eventDescription, eventName).toBeTruthy();
        }
    });
});

describe('actor definition', () => {
    const actor = readJson('.actor/actor.json');

    it('is configured as an MCP standby server', () => {
        expect(actor.usesStandbyMode).toBe(true);
        expect(actor.webServerMcpPath).toBe('/mcp');
        expect(actor.name).toBe('jobicy-jobs-mcp');
    });
});

describe('proxied MCP server', () => {
    it('is installed at the path the proxy command uses', () => {
        const mainSource = readFileSync('src/main.ts', 'utf8');
        const match = mainSource.match(/const MCP_COMMAND = \[([^\]]+)\]/);
        expect(match, 'MCP_COMMAND not found in src/main.ts').not.toBeNull();

        const parts = match?.[1];
        const [, script] = parts ? parts.match(/'((?:node_modules|vendor)\/[^']+)'/) ?? [] : [];
        expect(script, 'MCP_COMMAND must point at a real server entry point').toBeTruthy();
        expect(existsSync(script as string), `${script} is missing - run npm install`).toBe(true);
    });
});
